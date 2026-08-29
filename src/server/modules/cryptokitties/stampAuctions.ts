import BN from 'bn.js';
import type { Db } from 'mongodb';
import Contracts from './contracts';
import { calculateCurrentPrice } from './indexer';

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();

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

/**
 * After nfts are complete, sale/sire is whoever the auction contract owns.
 * Prices come from the latest un-ended AuctionCreated on that contract.
 */
export const stampAuctionsFromOwners = async (db: Db, nftsName = 'ck_nfts_next') => {
    const nfts = db.collection(nftsName);
    const events = db.collection('ck_events');
    const now = Math.floor(Date.now() / 1000);

    const cleared = await nfts.updateMany(
        { owner: { $nin: [SALE, SIRE] }, $or: [{ sale: true }, { sire: true }] },
        {
            $set: { sale: false, sire: false },
            $unset: {
                currentPrice: '',
                startingPrice: '',
                endingPrice: '',
                duration: '',
                auctionStart: '',
                auctionEnd: '',
            },
        },
    );

    const onSale = await nfts.updateMany({ owner: SALE }, { $set: { sale: true, sire: false } });
    const onSire = await nfts.updateMany({ owner: SIRE }, { $set: { sale: false, sire: true } });

    let priced = 0;
    const listed = nfts.find(
        { owner: { $in: [SALE, SIRE] } },
        { projection: { tokenId: 1, owner: 1 } },
    );
    for await (const kitty of listed) {
        const address = (kitty.owner as string).toLowerCase();
        const created = await openAuction(events, Number(kitty.tokenId), address);
        if (!created?.startingPrice) continue;
        const auctionStart = Number(created.timestamp);
        const duration = Number(created.duration);
        const auctionEnd = new BN(auctionStart).add(new BN(duration)).toNumber();
        const currentPrice = calculateCurrentPrice(
            String(created.startingPrice),
            String(created.endingPrice),
            String(auctionStart),
            String(auctionEnd),
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
    }

    return {
        cleared: cleared.modifiedCount,
        onSale: onSale.modifiedCount,
        onSire: onSire.modifiedCount,
        priced,
    };
};
