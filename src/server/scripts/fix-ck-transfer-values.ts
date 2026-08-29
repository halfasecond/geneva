/**
 * Recompute Transfer.value from Seaport/Wyvern logs in the same tx.
 * Never copies tx.value onto each kitty in a sweep.
 *
 * Usage:
 *   yarn ck:fix-values
 *   yarn ck:fix-values -- --dry-run --limit 20
 */
import https from 'https';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { padValue, valuesFromLogs, type RpcLog } from '../modules/cryptokitties/marketplaceValue';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const RPC = process.env.CK_FILL_RPC || 'https://eth.drpc.org';

const arg = (name: string, fallback?: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? fallback : process.argv[idx + 1];
};

const dryRun = process.argv.includes('--dry-run');
const limit = Number(arg('--limit', '0')) || 0;

const rpc = (method: string, params: unknown[]): Promise<any> =>
    new Promise((resolve, reject) => {
        const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const u = new URL(RPC);
        const lib = u.protocol === 'http:' ? http : https;
        const req = lib.request(
            {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method: 'POST',
                headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
                timeout: 45000,
            },
            (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    try {
                        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                        if (body.error) reject(new Error(body.error.message || JSON.stringify(body.error)));
                        else resolve(body.result);
                    } catch (error) {
                        reject(error);
                    }
                });
            },
        );
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('RPC timeout'));
        });
        req.write(payload);
        req.end();
    });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    await waitForDb();
    const events = mongoose.connection.db!.collection('ck_events');
    const stamped = await events
        .find(
            { event: 'Transfer', value: { $exists: true, $nin: [null, ''] } },
            { projection: { transactionHash: 1, tokenId: 1, logIndex: 1, blockNumber: 1, value: 1 } },
        )
        .toArray();
    const byHash = new Map<string, typeof stamped>();
    for (const row of stamped) {
        const hash = String(row.transactionHash);
        const list = byHash.get(hash) || [];
        list.push(row);
        byHash.set(hash, list);
    }
    const hashes = [...byHash.keys()];
    const list = limit > 0 ? hashes.slice(0, limit) : hashes;
    console.log(`[ck:fix-values] ${list.length}/${hashes.length} txs, ${stamped.length} stamped transfers (dryRun=${dryRun})`);

    let set = 0;
    let cleared = 0;
    let failed = 0;
    for (let i = 0; i < list.length; i += 1) {
        const hash = list[i];
        try {
            const receipt = await rpc('eth_getTransactionReceipt', [hash]);
            const logs = (receipt?.logs || []) as RpcLog[];
            const priced = valuesFromLogs(logs);
            const rows = byHash.get(hash) || [];
            for (const row of rows) {
                const wei = priced.get(Number(row.tokenId));
                if (wei !== undefined && wei > 0n) {
                    const next = padValue(wei);
                    if (row.value !== next) {
                        if (!dryRun) {
                            await events.updateOne(
                                { blockNumber: row.blockNumber, logIndex: row.logIndex },
                                { $set: { value: next } },
                            );
                        }
                        set += 1;
                    }
                } else if (row.value) {
                    if (!dryRun) {
                        await events.updateOne(
                            { blockNumber: row.blockNumber, logIndex: row.logIndex },
                            { $unset: { value: '' } },
                        );
                    }
                    cleared += 1;
                }
            }
        } catch (error) {
            failed += 1;
            const msg = error instanceof Error ? error.message : String(error);
            if (/429|timeout|overloaded|temporar/i.test(msg)) {
                console.warn(`[ck:fix-values] ${hash} ${msg} — backoff`);
                await sleep(2000);
                i -= 1;
                failed -= 1;
                continue;
            }
            console.warn(`[ck:fix-values] ${hash}`, msg);
        }
        if ((i + 1) % 25 === 0) {
            console.log(`[ck:fix-values] ${i + 1}/${list.length} set=${set} cleared=${cleared} failed=${failed}`);
        }
        await sleep(80);
    }

    const note = `Transfer values: set ${set}, cleared cart stamps ${cleared}, failed ${failed}. dryRun=${dryRun}`;
    console.log(note);
    if (!dryRun) {
        await mongoose.connection.db!.collection('ck_audit').updateOne(
            { _id: AUDIT_ID as any },
            { $set: { note, updatedAt: new Date() } },
            { upsert: true },
        );
    }
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
