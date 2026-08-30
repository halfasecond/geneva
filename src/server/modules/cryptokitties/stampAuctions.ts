import type { Db } from 'mongodb';
import Contracts from './contracts';
import { calculateCurrentPrice } from './indexer';
import { AUDIT_ID } from './routes/audit';

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();
const AUCTION = [SALE, SIRE];
const AUCTION_MATCH = [
    SALE,
    SIRE,
    '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C',
    '0xC7af99Fe5513eB6710e6D5f44F9989dA40F27F26',
];
const CHUNK = 1000;

const openAuction = async (events: any, tokenId: number, address: string) => {
    const created = await events.find({ event: 'AuctionCreated', tokenId, address })
        .sort({ blockNumber: -1, logIndex: -1 })
        .limit(1)
        .next();
    if (!created) return null;
    const ended = await events.find({
        event: { $in: ['AuctionSuccessful', 'AuctionCancelled'] },
        tokenId,
        address,
        $or: [
            { blockNumber: { $gt: created.blockNumber } },
            { blockNumber: created.blockNumber, logIndex: { $gt: created.logIndex } },
        ],
    }).limit(1).next();
    return ended ? null : created;
};

const lower = (value: unknown) => String(value || '').toLowerCase();

const writeNote = async (db: Db, note: string, extra: Record<string, unknown> = {}) => {
    await db.collection('ck_audit').updateOne(
        { _id: AUDIT_ID as any },
        { $set: { note, updatedAt: new Date(), ...extra } },
        { upsert: true },
    );
};

/**
 * Listed = last Transfer still sits on Sale/Sire.
 * Display owner is the lister (Transfer.from), not the auction contract.
 * sale/sire flags are what the frontend uses for the market.
 */
const assignAuctionOwnersFromTransfers = async (db: Db, nftsName: string) => {
    const events = db.collection('ck_events');
    const nfts = db.collection(nftsName);
    const owners = db.collection(nftsName.replace('ck_nfts', 'ck_owners'));

    await writeNote(db, `Finding listed kitties (last Transfer to Sale/Sire) on ${nftsName}...`);
    const held = await events
        .aggregate<{ _id: number; to: string; from: string }>(
            [
                {
                    $match: {
                        event: 'Transfer',
                        $or: [{ to: { $in: AUCTION_MATCH } }, { from: { $in: AUCTION_MATCH } }],
                    },
                },
                { $sort: { tokenId: 1, blockNumber: 1, logIndex: 1 } },
                {
                    $group: {
                        _id: '$tokenId',
                        to: { $last: { $toLower: { $ifNull: ['$to', ''] } } },
                        from: { $last: { $toLower: { $ifNull: ['$from', ''] } } },
                    },
                },
                { $match: { to: { $in: AUCTION } } },
            ],
            { allowDiskUse: true },
        )
        .toArray();

    let moved = 0;
    for (let i = 0; i < held.length; i += CHUNK) {
        const slice = held.slice(i, i + CHUNK);
        const ids = slice.map((row) => row._id);
        const docs = await nfts
            .find({ tokenId: { $in: ids } }, { projection: { tokenId: 1, owner: 1 } })
            .toArray();
        const byId = new Map(docs.map((doc) => [Number(doc.tokenId), lower(doc.owner)]));
        const ops: Array<{
            updateOne: {
                filter: { tokenId: number };
                update: Record<string, unknown>;
            };
        }> = [];
        const deltas = new Map<string, number>();
        for (const row of slice) {
            const contract = lower(row.to);
            const lister = lower(row.from);
            if (!AUCTION.includes(contract) || !lister || row._id === 0) continue;
            const prev = byId.get(Number(row._id)) || '';
            const displayOwner = AUCTION.includes(lister) ? prev : lister;
            ops.push({
                updateOne: {
                    filter: { tokenId: Number(row._id) },
                    update: {
                        $set: {
                            owner: displayOwner,
                            sale: contract === SALE,
                            sire: contract === SIRE,
                        },
                        $pull: { owners: { $in: AUCTION } },
                    },
                },
            });
            if (prev && displayOwner && prev !== displayOwner) {
                deltas.set(prev, (deltas.get(prev) || 0) - 1);
                deltas.set(displayOwner, (deltas.get(displayOwner) || 0) + 1);
                moved += 1;
            }
        }
        if (ops.length) await nfts.bulkWrite(ops, { ordered: false });
        for (const [owner, delta] of deltas) {
            if (!delta) continue;
            await owners.updateOne({ owner }, { $inc: { balance: delta } }, { upsert: true });
        }
        if (i === 0 || (i + CHUNK) % 5000 < CHUNK) {
            await writeNote(
                db,
                `Restored listers ${Math.min(i + CHUNK, held.length).toLocaleString()}/${held.length.toLocaleString()} on ${nftsName}.`,
                { assignedListed: held.length, assignedMoved: moved },
            );
        }
    }

    const ownersCol = db.collection(nftsName.replace('ck_nfts', 'ck_owners'));
    await ownersCol.updateOne({ owner: SALE }, { $set: { balance: 0 } });
    await ownersCol.updateOne({ owner: SIRE }, { $set: { balance: 0 } });

    return { listed: held.length, moved };
};

/**
 * Listed kitties keep the lister as owner. sale/sire flags mark the market.
 * Prices come from the latest un-ended AuctionCreated on Sale/Sire.
 */
export const stampAuctionsFromOwners = async (
    db: Db,
    nftsName = 'ck_nfts_next',
    opts: { skipAssign?: boolean; skipPrices?: boolean } = {},
) => {
    const nfts = db.collection(nftsName);
    const events = db.collection('ck_events');
    const now = Math.floor(Date.now() / 1000);

    const assigned = opts.skipAssign
        ? { listed: 0, moved: 0 }
        : await assignAuctionOwnersFromTransfers(db, nftsName);

    const onSale = await nfts.countDocuments({ sale: true });
    const onSire = await nfts.countDocuments({ sire: true });
    const cleared = { modifiedCount: 0 };

    let priced = 0;
    let skipped = 0;
    if (opts.skipPrices) {
        return {
            listed: assigned.listed,
            moved: assigned.moved,
            cleared: 0,
            onSale,
            onSire,
            priced,
            skipped,
        };
    }

    const listed = nfts.find(
        { $or: [{ sale: true }, { sire: true }] },
        { projection: { tokenId: 1, owner: 1, sale: 1, sire: 1 } },
    );
    for await (const kitty of listed) {
        try {
            const address = kitty.sale ? SALE : SIRE;
            const created = await openAuction(events, Number(kitty.tokenId), address);
            if (!created?.startingPrice) continue;
            const auctionStart = Number(created.timestamp);
            const duration = Number(created.duration);
            if (!Number.isFinite(auctionStart) || !Number.isFinite(duration)) {
                skipped += 1;
                continue;
            }
            const auctionEnd = auctionStart + duration;
            const currentPrice = calculateCurrentPrice(
                String(created.startingPrice),
                String(created.endingPrice),
                String(Math.floor(auctionStart)),
                String(Math.floor(auctionEnd)),
                now,
            );
            await nfts.updateOne(
                { tokenId: kitty.tokenId },
                {
                    $set: {
                        startingPrice: String(created.startingPrice),
                        endingPrice: String(created.endingPrice),
                        duration,
                        auctionStart,
                        auctionEnd,
                        currentPrice,
                    },
                },
            );
            priced += 1;
        } catch (error) {
            skipped += 1;
            if (skipped <= 10) {
                console.warn('skip price', kitty.tokenId, error);
            }
        }
        if ((priced + skipped) % 1000 === 0) {
            await writeNote(
                db,
                `Pricing open auctions on ${nftsName}: ${priced.toLocaleString()} priced, ${skipped} skipped (sale ${onSale} sire ${onSire}).`,
                { priced, skipped, onSale, onSire },
            );
        }
    }

    return {
        listed: assigned.listed,
        moved: assigned.moved,
        cleared: cleared.modifiedCount,
        onSale,
        onSire,
        priced,
        skipped,
    };
};
