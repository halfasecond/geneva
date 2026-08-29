/**
 * Rebuild ck_nfts + ck_owners from ck_events already in Mongo.
 *
 * Prereq: import events first (scripts/import-cryptokitties-data.sh --events)
 *
 * Usage:
 *   yarn ck:rebuild
 *   yarn ck:rebuild -- --from-block 4605346
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import createModels from '../modules/cryptokitties/models';
import { mockWeb3, noopEmitter, processCryptoKittiesEvent } from '../modules/cryptokitties/processEvent';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const STATE_EVENTS = ['Transfer', 'Birth', 'Pregnant'] as const;
const BATCH = 5000;

const parseFromBlock = () => {
    const idx = process.argv.indexOf('--from-block');
    if (idx === -1) return 0;
    return Number(process.argv[idx + 1]) || 0;
};

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    const fromBlock = parseFromBlock();
    await waitForDb();

    const Models = createModels('ck', mongoose.connection);
    const eventFilter: Record<string, unknown> = { event: { $in: [...STATE_EVENTS] } };
    if (fromBlock > 0) eventFilter.blockNumber = { $gte: fromBlock };

    const total = await Models.Event.countDocuments(eventFilter);
    if (!total) {
        console.error('No ck_events found — run: yarn ck:import --events');
        process.exit(1);
    }

    const started = Date.now();
    const auditCol = mongoose.connection.db!.collection('ck_audit');
    const writeProgress = async (processed: number, nftCount: number, extra: Record<string, unknown> = {}) => {
        const pct = Number(((100 * processed) / Math.max(1, total)).toFixed(3));
        await auditCol.updateOne(
            { _id: AUDIT_ID as any },
            {
                $set: {
                    All: processed,
                    Total: total,
                    pct,
                    holeFrom: `rebuild ${processed}/${total} state events, ${nftCount} kitties`,
                    note: extra.note || `Full index rebuild from ck_events (${pct}%).`,
                    timer: Date.now() - started,
                    updatedAt: new Date(),
                },
            },
            { upsert: true },
        );
    };

    console.log(`Rebuilding ck_nfts + ck_owners from ${total.toLocaleString()} state events...`);
    console.log('Clearing ck_nfts and ck_owners...');
    await Models.NFT.deleteMany({});
    await Models.Owner.deleteMany({});
    await writeProgress(0, 0, { note: 'Cleared ck_nfts + ck_owners; replaying events.' });

    const cursor = Models.Event.find(eventFilter)
        .sort({ blockNumber: 1, logIndex: 1 })
        .lean()
        .cursor();

    let processed = 0;
    let errors = 0;

    for await (const event of cursor) {
        try {
            await processCryptoKittiesEvent(event, Models, mockWeb3, noopEmitter);
        } catch (error) {
            errors += 1;
            if (errors <= 10) {
                console.error('Event failed:', event.blockNumber, event.logIndex, event.event, error);
            }
        }
        processed += 1;
        if (processed % BATCH === 0 || processed === total) {
            const elapsed = (Date.now() - started) / 1000;
            const rate = Math.round(processed / elapsed);
            const pct = ((100 * processed) / total).toFixed(1);
            const nftCount = await Models.NFT.estimatedDocumentCount();
            console.log(
                `${pct}% — ${processed.toLocaleString()}/${total.toLocaleString()} events (${rate}/s), ${nftCount.toLocaleString()} kitties`,
            );
            await writeProgress(processed, nftCount);
        }
    }

    const nftCount = await Models.NFT.estimatedDocumentCount();
    const ownerCount = await Models.Owner.estimatedDocumentCount();
    await writeProgress(total, nftCount, {
        note: `Rebuild done. ${nftCount.toLocaleString()} kitties, ${ownerCount.toLocaleString()} owners, ${errors} errors.`,
    });
    console.log(`Done. ${nftCount.toLocaleString()} kitties, ${ownerCount.toLocaleString()} owners, ${errors} errors.`);
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});