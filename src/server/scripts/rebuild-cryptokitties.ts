/**
 * Replay ck_events into ck_nfts_next + ck_owners_next.
 * Live ck_nfts / ck_owners keep serving. Promote when the audit looks right:
 *   yarn ck:promote
 *
 * Usage:
 *   yarn ck:rebuild
 *   yarn ck:rebuild -- --from-block 25862354 --append
 */
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import createModels from '../modules/cryptokitties/models';
import { mockWeb3, noopEmitter, processCryptoKittiesEvent } from '../modules/cryptokitties/processEvent';
import { stampAuctionsFromOwners } from '../modules/cryptokitties/stampAuctions';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const STATE_EVENTS = ['Transfer', 'Birth', 'Pregnant'] as const;
const BATCH = 5000;
const NEXT = '_next';
const AUDIT_JSON = [
    path.resolve(process.cwd(), 'dist/kittyFamily/ck-audit.json'),
    path.resolve(process.cwd(), 'public/kittyFamily/ck-audit.json'),
];

const parseFromBlock = () => {
    const idx = process.argv.indexOf('--from-block');
    if (idx === -1) return 0;
    return Number(process.argv[idx + 1]) || 0;
};

const append = process.argv.includes('--append');

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const main = async () => {
    const fromBlock = parseFromBlock();
    if (append && fromBlock <= 0) {
        console.error('--append requires --from-block (events that arrived during the rebuild)');
        process.exit(1);
    }
    await waitForDb();

    const live = createModels('ck', mongoose.connection);
    const next = createModels('ck', mongoose.connection, NEXT);
    const eventFilter: Record<string, unknown> = { event: { $in: [...STATE_EVENTS] } };
    if (fromBlock > 0) eventFilter.blockNumber = { $gte: fromBlock };

    const total = await live.Event.countDocuments(eventFilter);
    if (!total) {
        console.error('No ck_events found — run: yarn ck:import --events');
        process.exit(1);
    }

    const started = Date.now();
    const auditCol = mongoose.connection.db!.collection('ck_audit');
    const liveNfts = mongoose.connection.db!.collection('ck_nfts');
    const writeProgress = async (processed: number, nftCount: number, extra: Record<string, unknown> = {}) => {
        const pct = Number(((100 * processed) / Math.max(1, total)).toFixed(3));
        const liveCount = await liveNfts.estimatedDocumentCount();
        const patch: Record<string, unknown> = {
            All: processed,
            Total: total,
            pct,
            holeFrom: `ck_nfts_next ${nftCount} kitties (live ${liveCount} untouched)`,
            note: extra.note || `Building ck_nfts_next / ck_owners_next from ck_events (${pct}%). Live tables still serving.`,
            timer: Date.now() - started,
            updatedAt: new Date(),
        };
        if (extra.rebuildThroughBlock) patch.rebuildThroughBlock = extra.rebuildThroughBlock;
        await auditCol.updateOne({ _id: AUDIT_ID as any }, { $set: patch }, { upsert: true });
        const row = await auditCol.findOne({ _id: AUDIT_ID as any });
        const json = JSON.stringify(row, null, 2);
        for (const file of AUDIT_JSON) {
            try {
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, json);
            } catch (error) {
                console.warn('could not write', file, error);
            }
        }
    };

    console.log(
        append
            ? `Appending ck_events from block ${fromBlock} onto existing ck_nfts_next (${total.toLocaleString()} events)...`
            : `Building ck_nfts_next + ck_owners_next from ${total.toLocaleString()} state events...`,
    );
    console.log('Live ck_nfts / ck_owners are not modified.');
    if (!append) {
        await next.NFT.deleteMany({});
        await next.Owner.deleteMany({});
        await writeProgress(0, 0, { note: 'Cleared staging tables only. Replaying into ck_nfts_next.' });
    }

    const cursor = live.Event.find(eventFilter)
        .sort({ blockNumber: 1, logIndex: 1 })
        .lean()
        .cursor();

    let processed = 0;
    let errors = 0;
    let lastBlock = fromBlock;

    for await (const event of cursor) {
        try {
            await processCryptoKittiesEvent(event, next, mockWeb3, noopEmitter);
        } catch (error) {
            errors += 1;
            if (errors <= 10) {
                console.error('Event failed:', event.blockNumber, event.logIndex, event.event, error);
            }
        }
        processed += 1;
        lastBlock = Math.max(lastBlock, Number(event.blockNumber) || 0);
        if (processed % BATCH === 0 || processed === total) {
            const elapsed = (Date.now() - started) / 1000;
            const rate = Math.round(processed / elapsed);
            const pct = ((100 * processed) / total).toFixed(1);
            const nftCount = await next.NFT.estimatedDocumentCount();
            console.log(
                `${pct}% — ${processed.toLocaleString()}/${total.toLocaleString()} events (${rate}/s), ${nftCount.toLocaleString()} kitties in _next`,
            );
            await writeProgress(processed, nftCount, { rebuildThroughBlock: lastBlock });
        }
    }

    const nftCount = await next.NFT.estimatedDocumentCount();
    const ownerCount = await next.Owner.estimatedDocumentCount();
    const birthCount = await live.Event.countDocuments({ event: 'Birth' });
    console.log('Stamping sale/sire from auction-contract owners on ck_nfts_next...');
    const auctions = await stampAuctionsFromOwners(mongoose.connection.db!, 'ck_nfts_next');
    console.log('Auction stamp', auctions);
    await writeProgress(total, nftCount, {
        note: `_next ready. ${nftCount.toLocaleString()} kitties / ${ownerCount.toLocaleString()} owners / ${errors} errors. Births ${birthCount.toLocaleString()}. sale ${auctions.onSale} sire ${auctions.onSire}. yarn ck:promote when happy.`,
    });
    console.log(
        `Done staging. ${nftCount.toLocaleString()} kitties, ${ownerCount.toLocaleString()} owners, ${errors} errors. Promote with: yarn ck:promote`,
    );
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
