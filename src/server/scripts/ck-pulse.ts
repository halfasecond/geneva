/**
 * Header-only block pulse while INDEXER_FOLLOW is off.
 * Closes kn_dailies when a block timestamp crosses UTC midnight.
 */
import EventEmitter from 'events';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { resolveHeadRpc } from '../indexer';
import { startBlockPulse } from '../indexer/pulse';
import { startDailyMidnightJob } from '../modules/kittynews/midnight';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    await waitForDb();
    const emitter = new EventEmitter();
    startDailyMidnightJob(emitter, mongoose.connection);
    startBlockPulse(resolveHeadRpc(), emitter);
    console.log('[ck:pulse] running');
};

main().catch((error) => {
    console.error('[ck:pulse]', error);
    process.exit(1);
});
