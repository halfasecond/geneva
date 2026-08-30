/**
 * Replay kh_events apply/remove onto ck_nfts.hats. Live table, no wipe.
 *
 * Usage:
 *   yarn kh:stamp
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const APPLY = new Set(['applyItem', 'buyItemAndApply', 'Apply']);
const REMOVE = new Set(['removeItem', 'Remove']);

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    await waitForDb();
    const db = mongoose.connection.db!;
    const events = db.collection('kh_events');
    const nfts = db.collection('ck_nfts');
    const hats = db.collection('kh_hats');

    const catalog = await hats.find({}, { projection: { tokenAddress: 1, contract: 1, itemName: 1 } }).toArray();
    const nameByAddr = new Map<string, string>();
    for (const row of catalog) {
        const addr = String(row.tokenAddress || '').toLowerCase();
        const contract = String(row.contract || '');
        const fromContract = contract.replace(/^Item/i, '');
        const name = String(row.itemName || fromContract);
        if (addr) nameByAddr.set(addr, fromContract || name);
    }

    const rows = await events
        .find({ event: { $in: [...APPLY, ...REMOVE] } })
        .sort({ blockNumber: 1, logIndex: 1 })
        .toArray();

    type Hat = { blockNumber: number; timestamp: number; itemName: string; transactionHash: string };
    const byKitty = new Map<number, Hat[]>();
    let lastBlock = 0;

    for (const row of rows) {
        const tokenId = Number(row.tokenId);
        if (!tokenId) continue;
        const addr = String(row.to || row.address || '').toLowerCase();
        const itemName = String(row.itemName || nameByAddr.get(addr) || '').trim();
        if (!itemName) continue;
        const event = String(row.event);
        const hat: Hat = {
            blockNumber: Number(row.blockNumber || 0),
            timestamp: Number(row.timestamp || 0),
            itemName,
            transactionHash: String(row.transactionHash || ''),
        };
        lastBlock = Math.max(lastBlock, hat.blockNumber);
        const list = byKitty.get(tokenId) || [];
        if (REMOVE.has(event)) {
            byKitty.set(
                tokenId,
                list.filter((h) => h.itemName !== itemName),
            );
        } else {
            byKitty.set(tokenId, [...list.filter((h) => h.itemName !== itemName), hat]);
        }
    }

    const ids = [...byKitty.keys()];
    const CHUNK = 500;
    let written = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        await nfts.bulkWrite(
            slice.map((tokenId) => {
                const list = byKitty.get(tokenId) || [];
                const last = list[list.length - 1];
                return {
                    updateOne: {
                        filter: { tokenId },
                        update: {
                            $set: {
                                hats: list,
                                lastHatBlockNumber: last?.blockNumber || 0,
                            },
                        },
                    },
                };
            }),
            { ordered: false },
        );
        written += slice.length;
    }

    const withHats = [...byKitty.values()].filter((h) => h.length).length;
    console.log(
        JSON.stringify(
            {
                events: rows.length,
                kitties: written,
                wearing: withHats,
                lastBlock,
            },
            null,
            2,
        ),
    );
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error('[kh:stamp] failed', error);
    process.exit(1);
});
