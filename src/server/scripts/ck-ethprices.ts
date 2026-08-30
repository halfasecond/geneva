/**
 * Fill kn_ethprices from Binance ETHUSDT daily closes.
 * CryptoCompare min-api now requires a CoinDesk key (the old source).
 * Default: insert missing days only. --replace overwrites existing rows.
 *
 * Usage:
 *   yarn ck:ethprices
 *   yarn ck:ethprices -- --replace
 */
import https from 'https';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const GENESIS = 1511395200;
const replace = process.argv.includes('--replace');
const finalize = process.argv.includes('--finalize');

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const getJson = (url: string): Promise<any> =>
    new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                    } catch (error) {
                        reject(error);
                    }
                });
            })
            .on('error', reject);
    });

const fetchBinance = async (startSec: number, endSec: number) => {
    const out: Array<{ timestamp: number; ethprice: number }> = [];
    let startMs = startSec * 1000;
    const endMs = endSec * 1000;
    while (startMs < endMs) {
        const url = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1000`;
        const rows = await getJson(url);
        if (!Array.isArray(rows) || !rows.length) break;
        for (const row of rows) {
            const ts = Math.floor(Number(row[0]) / 1000);
            const close = Number(row[4]);
            if (Number.isFinite(ts) && Number.isFinite(close)) {
                out.push({ timestamp: ts, ethprice: close });
            }
        }
        const last = Number(rows[rows.length - 1][0]);
        const next = last + 86400000;
        if (next <= startMs) break;
        startMs = next;
        await new Promise((r) => setTimeout(r, 200));
    }
    return out;
};

const main = async () => {
    await waitForDb();
    const col = mongoose.connection.db!.collection('kn_ethprices');
    const last = await col.find({ timestamp: { $exists: true } }).sort({ timestamp: -1 }).limit(1).next();
    const today = Math.floor(Date.now() / 1000);
    const todayUtc = Math.floor(today / 86400) * 86400;
    const from = finalize
        ? todayUtc - 86400 * 3
        : replace || !last?.timestamp
          ? GENESIS
          : Number(last.timestamp) + 86400;
    if (!finalize && from > todayUtc) {
        console.log('[ck:ethprices] already current', last?.timestamp);
        await mongoose.disconnect();
        return;
    }
    const overwrite = replace || finalize;
    console.log(`[ck:ethprices] Binance ETHUSDT ${from} → ${todayUtc} replace=${overwrite}`);
    const rows = await fetchBinance(from, todayUtc + 86399);
    let upserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const ops = slice.map((row) =>
            overwrite
                ? {
                      updateOne: {
                          filter: { timestamp: row.timestamp },
                          update: { $set: { timestamp: row.timestamp, ethprice: row.ethprice } },
                          upsert: true,
                      },
                  }
                : {
                      updateOne: {
                          filter: { timestamp: row.timestamp },
                          update: { $setOnInsert: { timestamp: row.timestamp, ethprice: row.ethprice } },
                          upsert: true,
                      },
                  },
        );
        const result = await col.bulkWrite(ops, { ordered: false });
        upserted += (result.upsertedCount || 0) + (replace ? result.modifiedCount || 0 : 0);
    }
    const count = await col.estimatedDocumentCount();
    console.log(`[ck:ethprices] wrote ${upserted} (collection ${count})`);
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error('[ck:ethprices] failed', error);
    process.exit(1);
});
