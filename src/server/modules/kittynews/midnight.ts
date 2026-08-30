import { spawn } from 'child_process';
import path from 'path';
import type { Connection } from 'mongoose';
import { AUDIT_ID } from '../cryptokitties/routes/audit';

const DAY = 86400;
const TIP_GAP_MS = 20_000;

const isoDay = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

let job = false;

const yarn = (args: string[]) =>
    new Promise<void>((resolve, reject) => {
        const child = spawn('yarn', args, {
            cwd: path.resolve(process.cwd()),
            stdio: 'inherit',
            env: process.env,
        });
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`yarn ${args.join(' ')} exited ${code}`));
        });
        child.on('error', reject);
    });

const runMidnight = (day: string) => yarn(['ck:midnight', '--day', day]);

/**
 * Close a UTC day when a block timestamp lands in the following day.
 * Wall-clock midnight can miss the last blocks still stamped in yesterday.
 */
export const startDailyMidnightJob = (emitter: { on: Function }, db: Connection) => {
    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        void onMidnightBlock(Number(number), Number(timestamp), db);
        void onTipBlock(Number(number), db);
    });
    console.log('[ck:midnight] waiting for block pulse to cross UTC day');
    console.log('[ck:tip] fill+stamp when pulse is ahead of ck_events (no WSS follow)');
};

async function onMidnightBlock(blockNumber: number, timestamp: number, db: Connection) {
    if (!timestamp || job) return;
    const col = db.db?.collection('kn_dailies');
    if (!col) return;
    const last = await col.find({}).sort({ timestamp: -1 }).limit(1).next();
    if (!last?.timestamp) return;
    const closeTs = Number(last.timestamp) + DAY;
    if (timestamp < closeTs + DAY) return;
    job = true;
    const day = isoDay(closeTs);
    console.log(`[ck:midnight] block ${blockNumber} ts ${timestamp} closed ${day}`);
    try {
        await runMidnight(day);
    } catch (error) {
        console.error('[ck:midnight]', error);
    } finally {
        job = false;
    }
}

let lastTip = 0;
async function onTipBlock(blockNumber: number, db: Connection) {
    if (job) return;
    if (!blockNumber) return;
    if (Date.now() - lastTip < TIP_GAP_MS) return;
    const audit = db.db?.collection('ck_audit');
    if (!audit) return;
    const row = await audit.findOne({ _id: AUDIT_ID as any }, { projection: { fillAt: 1, khFillAt: 1 } });
    const fillAt = Number(row?.fillAt || 0);
    const khFillAt = Number(row?.khFillAt || 0);
    if (fillAt >= blockNumber && khFillAt >= blockNumber) return;
    job = true;
    lastTip = Date.now();
    console.log(`[ck:tip] fill ck ${fillAt + 1} kh ${khFillAt + 1} → ${blockNumber}`);
    try {
        await yarn(['ck:fill', '--', '--range', '5']);
        await yarn(['ck:stamp-auctions', '--', '--live', '--recent']);
        await yarn(['kh:fill', '--', '--range', '5']);
        await yarn(['ck:fix-values', '--', '--unstamped', '--days', '1']);
        await yarn(['kh:stamp']);
    } catch (error) {
        console.error('[ck:tip]', error);
    } finally {
        job = false;
    }
}
