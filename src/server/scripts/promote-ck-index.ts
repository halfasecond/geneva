/**
 * Swap staging tables into live when the rebuild audit looks right.
 * Live names stay ck_nfts / ck_owners so the API does not restart.
 * Previous live tables land on ck_nfts_prev / ck_owners_prev (rollback: yarn ck:rollback).
 *
 * Usage:
 *   yarn ck:promote
 *   yarn ck:promote -- --dailies
 *   yarn ck:rollback
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const PAIRS = [
    { live: 'ck_nfts', next: 'ck_nfts_next', prev: 'ck_nfts_prev' },
    { live: 'ck_owners', next: 'ck_owners_next', prev: 'ck_owners_prev' },
    { live: 'kn_dailies', next: 'kn_dailies_next', prev: 'kn_dailies_prev' },
] as const;

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const exists = async (name: string) => {
    const rows = await mongoose.connection.db!.listCollections({ name }).toArray();
    return rows.length > 0;
};

const dropIf = async (name: string) => {
    if (await exists(name)) await mongoose.connection.db!.dropCollection(name);
};

const rename = async (from: string, to: string) => {
    await mongoose.connection.db!.collection(from).rename(to);
};

const note = async (text: string) => {
    await mongoose.connection.db!.collection('ck_audit').updateOne(
        { _id: AUDIT_ID as any },
        { $set: { note: text, holeFrom: text, updatedAt: new Date() } },
        { upsert: true },
    );
};

const promote = async () => {
    const dailiesOnly = process.argv.includes('--dailies');
    const pairs = dailiesOnly ? PAIRS.filter((pair) => pair.live === 'kn_dailies') : [...PAIRS];
    for (const pair of pairs) {
        if (!(await exists(pair.next))) {
            throw new Error(`Missing ${pair.next} — run yarn ck:dailies or yarn ck:rebuild first`);
        }
    }
    for (const pair of pairs) {
        await dropIf(pair.prev);
        await rename(pair.live, pair.prev);
        await rename(pair.next, pair.live);
        console.log(`${pair.next} → ${pair.live} (old ${pair.live} kept as ${pair.prev})`);
    }
    await note(
        dailiesOnly
            ? 'Promoted kn_dailies from kn_dailies_next. Previous table is kn_dailies_prev.'
            : 'Promoted ck_nfts / ck_owners / kn_dailies from *_next. Previous tables are *_prev.',
    );
};

const rollback = async () => {
    const dailiesOnly = process.argv.includes('--dailies');
    const pairs = dailiesOnly ? PAIRS.filter((pair) => pair.live === 'kn_dailies') : [...PAIRS];
    for (const pair of pairs) {
        if (!(await exists(pair.prev))) {
            throw new Error(`Missing ${pair.prev} — nothing to roll back`);
        }
    }
    for (const pair of pairs) {
        await dropIf(pair.next);
        await rename(pair.live, pair.next);
        await rename(pair.prev, pair.live);
        console.log(`${pair.prev} → ${pair.live} (staging moved back to ${pair.next})`);
    }
    await note(
        dailiesOnly
            ? 'Rolled back kn_dailies from kn_dailies_prev. Staging returned to kn_dailies_next.'
            : 'Rolled back nfts/owners/dailies from *_prev. Staging returned to *_next.',
    );
};

const main = async () => {
    await waitForDb();
    if (process.argv.includes('--rollback')) await rollback();
    else await promote();
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
