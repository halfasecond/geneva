import { spawn } from 'child_process';
import path from 'path';
import type { Connection } from 'mongoose';

const DAY = 86400;

const isoDay = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

const runMidnight = (day: string) =>
    new Promise<void>((resolve, reject) => {
        const child = spawn('yarn', ['ck:midnight', '--day', day], {
            cwd: path.resolve(process.cwd()),
            stdio: 'inherit',
            env: process.env,
        });
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ck:midnight exited ${code}`));
        });
        child.on('error', reject);
    });

/**
 * Close a UTC day when a block timestamp lands in the following day.
 * Wall-clock midnight can miss the last blocks still stamped in yesterday.
 */
export const startDailyMidnightJob = (emitter: { on: Function }, db: Connection) => {
    let running = false;
    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        void onBlock(Number(number), Number(timestamp));
    });

    async function onBlock(blockNumber: number, timestamp: number) {
        if (!timestamp || running) return;
        const col = db.db?.collection('kn_dailies');
        if (!col) return;
        const last = await col.find({}).sort({ timestamp: -1 }).limit(1).next();
        if (!last?.timestamp) return;
        const closeTs = Number(last.timestamp) + DAY;
        if (timestamp < closeTs + DAY) return;
        running = true;
        const day = isoDay(closeTs);
        console.log(`[ck:midnight] block ${blockNumber} ts ${timestamp} closed ${day}`);
        try {
            await runMidnight(day);
        } catch (error) {
            console.error('[ck:midnight]', error);
        } finally {
            running = false;
        }
    }

    console.log('[ck:midnight] waiting for block pulse to cross UTC day');
};
