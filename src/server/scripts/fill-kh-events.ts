/**
 * Fill kh_events from the last stored hat log to chain head.
 * Apply/Remove on each item contract + Buy on the hats marketplace core.
 *
 * Usage:
 *   yarn kh:fill
 *   yarn kh:fill -- --range 5
 *   yarn kh:fill -- --historical --range 1000
 */
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Web3 from 'web3';
const Web3Ctor = Web3 as any;
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';
import { APPLY_TOPIC, BUY_TOPIC, CORE_ADDR, REMOVE_TOPIC } from '../modules/kitty-hats/abi';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const DEFAULT_RPC = 'https://eth.drpc.org';

const arg = (name: string, fallback: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? fallback : process.argv[idx + 1];
};

const rpcUrl = process.env.KH_FILL_RPC || process.env.CK_FILL_RPC || process.env.RPC_URL || DEFAULT_RPC;
const ADDR_CHUNK = 20;
const rangeArg = Math.max(1, Number(arg('--range', process.env.KH_FILL_RANGE || '2000')));
const once = process.argv.includes('--once');
const noResume = process.argv.includes('--no-resume');
const noSkip = process.argv.includes('--no-skip');
const historical = process.argv.includes('--historical');
const fromBlockArg = Number(arg('--from-block', '0'));
const toBlockArg = Number(arg('--to-block', '0'));

const web3 = new Web3Ctor();

const rpc = (method: string, params: unknown[]): Promise<any> =>
    new Promise((resolve, reject) => {
        const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const u = new URL(rpcUrl);
        const lib = u.protocol === 'http:' ? http : https;
        const req = lib.request(
            {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method: 'POST',
                headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
                timeout: 60000,
            },
            (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    const text = Buffer.concat(chunks).toString('utf8');
                    try {
                        const body = JSON.parse(text);
                        if (body.error) reject(new Error(body.error.message || JSON.stringify(body.error)));
                        else resolve(body.result);
                    } catch {
                        reject(new Error(`RPC ${res.statusCode}: ${text.slice(0, 200)}`));
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
const hex = (n: number) => `0x${n.toString(16)}`;
const hexNum = (v: string | number) =>
    typeof v === 'string' && v.startsWith('0x') ? Number.parseInt(v, 16) : Number(v);

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const tsCache = new Map<number, number>();
async function blockTimestamp(blockNumber: number): Promise<number> {
    const hit = tsCache.get(blockNumber);
    if (hit) return hit;
    const block = await rpc('eth_getBlockByNumber', [hex(blockNumber), false]);
    const ts = hexNum(block.timestamp);
    tsCache.set(blockNumber, ts);
    if (tsCache.size > 20000) tsCache.clear();
    return ts;
}

async function getLogsOnce(addresses: string[], fromBlock: number, toBlock: number): Promise<any[]> {
    let attempt = 0;
    for (;;) {
        try {
            const result = await rpc('eth_getLogs', [
                {
                    address: addresses,
                    fromBlock: hex(fromBlock),
                    toBlock: hex(toBlock),
                    topics: [[APPLY_TOPIC, REMOVE_TOPIC, BUY_TOPIC]],
                },
            ]);
            if (!Array.isArray(result)) {
                if (result == null) throw new Error('eth_getLogs returned null');
                throw new Error(`eth_getLogs returned ${typeof result}`);
            }
            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            attempt += 1;
            if (/429|rate|too many|timeout|temporar|internal error|overloaded|retry later|ECONNRESET|socket hang|returned null/i.test(msg) && attempt < 12) {
                const wait = Math.min(60000, 2000 * 2 ** attempt);
                console.warn(`[kh:fill] ${msg} — retry in ${wait}ms`);
                await sleep(wait);
                continue;
            }
            throw error;
        }
    }
}

async function getLogs(addresses: string[], fromBlock: number, toBlock: number): Promise<any[]> {
    try {
        return await getLogsOnce(addresses, fromBlock, toBlock);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (addresses.length <= ADDR_CHUNK || !/null|too many|limit|large|413/i.test(msg)) throw error;
        console.warn(`[kh:fill] splitting ${addresses.length} addrs into chunks of ${ADDR_CHUNK}: ${msg.split('\n')[0].slice(0, 80)}`);
        const logs: any[] = [];
        for (let i = 0; i < addresses.length; i += ADDR_CHUNK) {
            const slice = addresses.slice(i, i + ADDR_CHUNK);
            logs.push(...(await getLogsOnce(slice, fromBlock, toBlock)));
            await sleep(40);
        }
        return logs;
    }
}

const main = async () => {
    await waitForDb();
    const db = mongoose.connection.db!;
    const events = db.collection('kh_events');
    const hats = db.collection('kh_hats');
    const audit = db.collection('ck_audit');
    try {
        await events.createIndex({ blockNumber: 1, logIndex: 1 }, { unique: true, sparse: true });
    } catch {
        /* already there */
    }

    const catalog = await hats.find({}, { projection: { tokenAddress: 1, contract: 1 } }).toArray();
    const nameByAddr = new Map<string, string>();
    const itemAddrs: string[] = [];
    for (const row of catalog) {
        const addr = String(row.tokenAddress || '').toLowerCase();
        if (!addr.startsWith('0x')) continue;
        itemAddrs.push(addr);
        nameByAddr.set(addr, String(row.contract || '').replace(/^Item/i, ''));
    }
    const addresses = [...new Set([CORE_ADDR, ...itemAddrs])];

    const existing = await audit.findOne({ _id: AUDIT_ID as any });
    const lastStored = await events.find({}, { projection: { blockNumber: 1 } }).sort({ blockNumber: -1 }).limit(1).next();
    const head = hexNum(await rpc('eth_blockNumber', []));
    const liveAt = Number(existing?.khFillAt || 0);
    let from = fromBlockArg;
    if (!from) {
        if (historical && !noResume && existing?.khBackfillAt) from = Number(existing.khBackfillAt) + 1;
        else if (historical && existing?.khGapFrom) from = Number(existing.khGapFrom);
        else if (!noResume && existing?.khFillAt && !historical) from = Number(existing.khFillAt) + 1;
        else if (lastStored?.blockNumber) from = Number(lastStored.blockNumber) + 1;
        else from = head;
    }
    const end = toBlockArg ? Math.min(toBlockArg, head) : historical && liveAt ? Math.min(liveAt, head) : head;
    if (from > end) {
        console.log(`[kh:fill] already at ${end} (head ${head})`);
        await mongoose.disconnect();
        return;
    }
    if (!historical && !noSkip && !toBlockArg && rangeArg <= 5 && end - from > 20_000) {
        const skipTo = Math.max(from, end - 500);
        console.warn(`[kh:fill] ${end - from} blocks behind on a ${rangeArg}-block cap — watch from ${skipTo}`);
        await audit.updateOne(
            { _id: AUDIT_ID as any },
            { $set: { khFillAt: skipTo - 1, khFillHead: head, khGapFrom: from, updatedAt: new Date() } },
            { upsert: true },
        );
        from = skipTo;
    }

    let rpcHost = 'rpc';
    try {
        rpcHost = new URL(rpcUrl).host;
    } catch {
        /* ignore */
    }
    let window = rangeArg;
    let inserted = 0;
    const started = Date.now();
    console.log(
        `[kh:fill] ${from} → ${end} on ${rpcHost} (${addresses.length} addrs, window ${window}${historical ? ', historical' : ''})`,
    );

    let cursor = from;
    while (cursor <= end) {
        const to = Math.min(cursor + window - 1, end);
        let logs: any[];
        try {
            logs = await getLogs(addresses, cursor, to);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const limited = msg.match(/limited to a (\d+) range/i);
            if (window > 1 && /range|too large|413|limited/i.test(msg)) {
                const cap = limited ? Math.max(1, Number(limited[1])) : Math.max(1, Math.floor(window / 2));
                window = Math.min(window - 1, cap) || 1;
                console.warn(`[kh:fill] shrink window to ${window}: ${msg.split('\n')[0].slice(0, 80)}`);
                if (!historical && !noSkip && window <= 5 && end - cursor > 20_000) {
                    const skipTo = Math.max(cursor, end - 500);
                    console.warn(`[kh:fill] ${end - cursor} blocks behind on a ${window}-block cap — watch from ${skipTo}`);
                    await audit.updateOne(
                        { _id: AUDIT_ID as any },
                        { $set: { khFillAt: skipTo - 1, khFillHead: head, khGapFrom: cursor, updatedAt: new Date() } },
                        { upsert: true },
                    );
                    cursor = skipTo;
                    continue;
                }
                continue;
            }
            throw error;
        }

        const docs: Record<string, unknown>[] = [];
        for (const log of logs) {
            const address = String(log.address).toLowerCase();
            const topic0 = String(log.topics?.[0] || '').toLowerCase();
            const blockNumber = hexNum(log.blockNumber);
            const timestamp = await blockTimestamp(blockNumber);
            const base = {
                logIndex: hexNum(log.logIndex),
                transactionHash: log.transactionHash,
                blockHash: log.blockHash,
                blockNumber,
                address,
                timestamp,
            };
            if (topic0 === APPLY_TOPIC) {
                const tokenId = Number(web3.eth.abi.decodeParameter('uint256', log.data));
                docs.push({
                    ...base,
                    event: 'applyItem',
                    tokenId,
                    itemName: nameByAddr.get(address) || '',
                    to: address,
                });
            } else if (topic0 === REMOVE_TOPIC) {
                const tokenId = Number(web3.eth.abi.decodeParameter('uint256', log.data));
                docs.push({
                    ...base,
                    event: 'removeItem',
                    tokenId,
                    itemName: nameByAddr.get(address) || '',
                    to: address,
                });
            } else if (topic0 === BUY_TOPIC && address === CORE_ADDR) {
                const itemName = String(web3.eth.abi.decodeParameter('string', log.data) || '');
                docs.push({
                    ...base,
                    event: 'buyItem',
                    itemName,
                    to: address,
                });
            }
        }

        if (docs.length) {
            try {
                const result = await events.bulkWrite(
                    docs.map((document) => ({
                        updateOne: {
                            filter: { blockNumber: document.blockNumber, logIndex: document.logIndex },
                            update: { $setOnInsert: document },
                            upsert: true,
                        },
                    })),
                    { ordered: false },
                );
                inserted += result.upsertedCount || 0;
            } catch (error: any) {
                if (error?.code !== 11000) throw error;
            }
        }

        await audit.updateOne(
            { _id: AUDIT_ID as any },
            {
                $max: { khFillAt: to },
                $set: {
                    khFillHead: head,
                    ...(historical ? { khBackfillAt: to } : {}),
                    updatedAt: new Date(),
                },
            },
            { upsert: true },
        );

        const elapsed = (Date.now() - started) / 1000;
        const span = Math.max(1, end - from + 1);
        console.log(
            `[kh:fill] ${cursor}-${to} logs=${logs.length} new=${docs.length} inserted=${inserted} ${(
                (100 * (to - from + 1)) /
                span
            ).toFixed(2)}% ~${Math.round((to - from + 1) / Math.max(1, elapsed))} blk/s`,
        );

        if (once) break;
        cursor = to + 1;
        window = rangeArg;
        await sleep(80);
    }

    console.log(`[kh:fill] done. inserted=${inserted}`);
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error('[kh:fill] failed', error);
    process.exit(1);
});
