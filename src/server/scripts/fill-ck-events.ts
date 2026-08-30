/**
 * Fill ck_events from the Dec 2021 dump cliff to chain head.
 * Events only — does not touch ck_nfts / ck_owners / live follow.
 *
 * Usage:
 *   yarn ck:fill
 *   yarn ck:fill -- --from-block 13821087 --range 2000
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Web3 from 'web3';
const Web3Ctor = Web3 as any;
import createModels from '../modules/cryptokitties/models';
import Contracts from '../modules/cryptokitties/contracts';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const ZERO = '0x0000000000000000000000000000000000000000';
const DUMP_END = 13821086;
const DEFAULT_RPC = 'https://eth.drpc.org';
const AUDIT_JSON = [
    path.resolve(process.cwd(), 'dist/kittyFamily/ck-audit.json'),
    path.resolve(process.cwd(), 'public/kittyFamily/ck-audit.json'),
];

const CORE_EVENTS = ['Transfer', 'Birth', 'Pregnant', 'Approval'];
const AUCTION_EVENTS = ['AuctionCreated', 'AuctionCancelled', 'AuctionSuccessful'];

type AbiItem = { type?: string; name?: string; inputs?: Array<{ name: string; type: string; indexed?: boolean }> };

const arg = (name: string, fallback: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? fallback : process.argv[idx + 1];
};

const rpcUrl = process.env.CK_FILL_RPC || DEFAULT_RPC;
const fromBlockArg = Number(arg('--from-block', String(DUMP_END + 1)));
const rangeArg = Math.max(1, Number(arg('--range', process.env.CK_FILL_RANGE || '2000')));
const once = process.argv.includes('--once');
const noResume = process.argv.includes('--no-resume');

const web3 = new Web3Ctor();

const contracts = [
    { name: 'Core', addr: Contracts.Core.addr.toLowerCase(), abi: Contracts.Core.abi as AbiItem[], events: CORE_EVENTS },
    { name: 'Sale', addr: Contracts.Sale.addr.toLowerCase(), abi: Contracts.Sale.abi as AbiItem[], events: AUCTION_EVENTS },
    { name: 'Sire', addr: Contracts.Sire.addr.toLowerCase(), abi: Contracts.Sire.abi as AbiItem[], events: AUCTION_EVENTS },
];

const topicMap = new Map<string, { address: string; name: string; inputs: NonNullable<AbiItem['inputs']> }>();
for (const c of contracts) {
    for (const item of c.abi) {
        if (item.type !== 'event' || !item.name || !c.events.includes(item.name)) continue;
        const types = (item.inputs || []).map((i) => i.type).join(',');
        const topic = web3.utils.keccak256(`${item.name}(${types})`);
        topicMap.set(`${c.addr}:${topic}`, { address: c.addr, name: item.name, inputs: item.inputs || [] });
    }
}

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

const hexNum = (v: string | number) => (typeof v === 'string' && v.startsWith('0x') ? Number.parseInt(v, 16) : Number(v));

const asAddr = (v: unknown) => String(v).toLowerCase();
const asNum = (v: unknown) => Number(v);
const asStr = (v: unknown) => (typeof v === 'bigint' ? v.toString() : String(v));

function mapDecoded(name: string, address: string, log: any, decoded: Record<string, unknown>, timestamp: number) {
    const doc: Record<string, unknown> = {
        logIndex: hexNum(log.logIndex),
        transactionIndex: hexNum(log.transactionIndex),
        transactionHash: log.transactionHash,
        blockHash: log.blockHash,
        blockNumber: hexNum(log.blockNumber),
        address,
        event: name,
        timestamp,
    };
    if (name === 'Pregnant') {
        doc.sireId = asNum(decoded.sireId);
        doc.matronId = asNum(decoded.matronId);
        doc.cooldownEndBlock = asNum(decoded.cooldownEndBlock);
        doc.owner = asAddr(decoded.owner);
    } else if (name === 'Transfer') {
        doc.from = asAddr(decoded.from);
        doc.to = asAddr(decoded.to);
        doc.tokenId = asNum(decoded.tokenId);
    } else if (name === 'Birth') {
        doc.tokenId = asNum(decoded.kittyId);
        doc.matronId = asNum(decoded.matronId);
        doc.sireId = asNum(decoded.sireId);
        doc.genes = asStr(decoded.genes);
        doc.owner = asAddr(decoded.owner);
    } else if (name === 'AuctionSuccessful') {
        doc.tokenId = asNum(decoded.tokenId);
        doc.totalPrice = asStr(decoded.totalPrice);
        doc.winner = asAddr(decoded.winner);
    } else if (name === 'AuctionCreated') {
        doc.tokenId = asNum(decoded.tokenId);
        doc.startingPrice = asStr(decoded.startingPrice);
        doc.endingPrice = asStr(decoded.endingPrice);
        doc.duration = asNum(decoded.duration);
    } else if (name === 'AuctionCancelled') {
        doc.tokenId = asNum(decoded.tokenId);
    } else if (name === 'Approval') {
        doc.owner = asAddr(decoded.owner);
        doc.approved = asAddr(decoded.approved);
        doc.tokenId = asNum(decoded.tokenId);
    }
    return doc;
}

async function getLogs(fromBlock: number, toBlock: number): Promise<any[]> {
    const addresses = contracts.map((c) => c.addr);
    let attempt = 0;
    for (;;) {
        try {
            const result = await rpc('eth_getLogs', [
                { address: addresses, fromBlock: hex(fromBlock), toBlock: hex(toBlock) },
            ]);
            if (!Array.isArray(result)) {
                throw new Error(`eth_getLogs returned ${result == null ? 'null' : typeof result}`);
            }
            return result;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            attempt += 1;
            if (/429|rate|too many|timeout|temporar|internal error|overloaded|retry later|ECONNRESET|socket hang/i.test(msg) && attempt < 12) {
                const wait = Math.min(60000, 2000 * 2 ** attempt);
                console.warn(`[ck:fill] ${msg} — retry in ${wait}ms`);
                await sleep(wait);
                continue;
            }
            throw error;
        }
    }
}

const hex = (n: number) => `0x${n.toString(16)}`;

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

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

async function main() {
    await waitForDb();
    const Models = createModels('ck', mongoose.connection);
    const auditCol = mongoose.connection.db!.collection('ck_audit');
    const existing = await auditCol.findOne({ _id: AUDIT_ID as any });

    const head = hexNum(await rpc('eth_blockNumber', []));
    let from = fromBlockArg;
    if (!noResume && existing?.fillAt && Number(existing.fillAt) + 1 > from) {
        from = Number(existing.fillAt) + 1;
    }
    let window = rangeArg;
    let inserted = Number(existing?.inserted || 0);
    const started = Date.now();
    const fillFrom = from;

    let rpcHost = 'rpc';
    try {
        rpcHost = new URL(rpcUrl).host;
    } catch {
        /* ignore */
    }
    console.log(`[ck:fill] ${from} → ${head} on ${rpcHost} (window ${window}, events only)`);

    const writeProgress = async (fillAt: number, extra: Record<string, unknown> = {}) => {
        const elapsedMs = Date.now() - started;
        const span = Math.max(1, head - fillFrom);
        const done = Math.min(span, Math.max(0, fillAt - fillFrom + 1));
        const pct = Number(((100 * done) / span).toFixed(3));
        const snapshot = {
            ...(existing || {}),
            _id: AUDIT_ID,
            All: fillAt - (DUMP_END + 1) + 1,
            Total: head - DUMP_END,
            timestamp: extra.timestamp || existing?.timestamp || 1639723176,
            Day: existing?.Day || 1486,
            holeFrom: `filling ${DUMP_END + 1} → ${head}; at ${fillAt}`,
            fillFrom: DUMP_END + 1,
            fillAt,
            fillHead: head,
            inserted,
            pct,
            timer: elapsedMs,
            note: extra.note || `Filling ck_events only (no owners). ${inserted.toLocaleString()} new logs.`,
            updatedAt: new Date(),
        };
        await auditCol.replaceOne({ _id: AUDIT_ID as any }, snapshot, { upsert: true });
        const json = JSON.stringify(snapshot, null, 2);
        for (const file of AUDIT_JSON) {
            try {
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, json);
            } catch (error) {
                console.warn('[ck:fill] could not write', file, error);
            }
        }
    };

    let cursor = from;
    while (cursor <= head) {
        const to = Math.min(cursor + window - 1, head);
        let logs: any[];
        try {
            logs = await getLogs(cursor, to);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const limited = msg.match(/limited to a (\d+) range/i);
            if (window > 1 && /range|too large|413|limited/i.test(msg)) {
                const cap = limited ? Math.max(1, Number(limited[1])) : Math.max(1, Math.floor(window / 2));
                window = Math.min(window - 1, cap);
                if (window < 1) window = 1;
                console.warn(`[ck:fill] shrink window to ${window}: ${msg.split('\n')[0].slice(0, 80)}`);
                continue;
            }
            throw error;
        }

        const docs: Record<string, unknown>[] = [];
        for (const log of logs) {
            const address = String(log.address).toLowerCase();
            const topic0 = log.topics?.[0];
            const meta = topicMap.get(`${address}:${topic0}`);
            if (!meta) continue;
            const decoded = web3.eth.abi.decodeLog(meta.inputs, log.data, log.topics.slice(1)) as Record<string, unknown>;
            if (meta.name === 'Transfer' && asAddr(decoded.from) === ZERO) continue;
            const timestamp = await blockTimestamp(hexNum(log.blockNumber));
            docs.push(mapDecoded(meta.name, address, log, decoded, timestamp));
        }

        if (docs.length) {
            try {
                const result = await Models.Event.collection.bulkWrite(
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

        if (!noResume) {
            await writeProgress(to, { timestamp: docs[docs.length - 1]?.timestamp });
        }
        const elapsed = (Date.now() - started) / 1000;
        const rate = Math.round((to - fillFrom + 1) / Math.max(1, elapsed));
        console.log(
            `[ck:fill] ${cursor}-${to} logs=${logs.length} new=${docs.length} inserted=${inserted} ${(
                (100 * (to - fillFrom + 1)) /
                (head - fillFrom + 1)
            ).toFixed(2)}% ~${rate} blk/s`,
        );

        if (once) break;
        cursor = to + 1;
        window = rangeArg;
        await sleep(200);
    }

    console.log(`[ck:fill] done. inserted=${inserted}`);
    await mongoose.disconnect();
}

main().catch((error) => {
    console.error('[ck:fill] failed', error);
    process.exit(1);
});
