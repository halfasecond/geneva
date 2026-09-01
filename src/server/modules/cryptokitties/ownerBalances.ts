import type { Db } from 'mongodb';
import Contracts from './contracts';

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();
const ZERO = '0x0000000000000000000000000000000000000000';
const SKIP = new Set([SALE, SIRE, ZERO, '']);
const CHUNK = 500;

/** Recount ck_owners.balance from ck_nfts.owner. Listed kitties stay on the lister. */
export const recomputeOwnerBalances = async (db: Db, nftsName = 'ck_nfts') => {
    const nfts = db.collection(nftsName);
    const owners = db.collection(nftsName.replace('ck_nfts', 'ck_owners'));
    const rows = await nfts
        .aggregate<{ _id: string; n: number }>(
            [
                { $match: { owner: { $type: 'string' } } },
                { $group: { _id: { $toLower: '$owner' }, n: { $sum: 1 } } },
            ],
            { allowDiskUse: true },
        )
        .toArray();

    const counts = new Map<string, number>();
    let nftsCounted = 0;
    for (const row of rows) {
        const owner = String(row._id || '').toLowerCase();
        if (SKIP.has(owner)) continue;
        const n = Number(row.n || 0);
        counts.set(owner, n);
        nftsCounted += n;
    }

    await owners.updateMany({}, { $set: { balance: 0 } });
    const entries = [...counts.entries()];
    for (let i = 0; i < entries.length; i += CHUNK) {
        const slice = entries.slice(i, i + CHUNK);
        await owners.bulkWrite(
            slice.map(([owner, balance]) => ({
                updateOne: {
                    filter: { owner },
                    update: { $set: { balance }, $setOnInsert: { birthed: 0 } },
                    upsert: true,
                },
            })),
            { ordered: false },
        );
    }
    await owners.updateOne({ owner: SALE }, { $set: { balance: 0 } }, { upsert: true });
    await owners.updateOne({ owner: SIRE }, { $set: { balance: 0 } }, { upsert: true });
    return { ownersWithKitties: counts.size, nftsCounted };
};
