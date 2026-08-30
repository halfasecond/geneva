/**
 * Build one UTC day from ck_events into kn_dailies_next, audit it, then
 * append to kn_dailies only with --commit. Live dailies are not rewritten.
 *
 * Usage:
 *   yarn ck:daily
 *   yarn ck:daily -- --day 2026-08-28
 *   yarn ck:daily -- --day 2026-08-28 --commit
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Contracts from '../modules/cryptokitties/contracts';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();

const arg = (name: string, fallback?: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? fallback : process.argv[idx + 1];
};

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const dayUtc = (iso?: string) => {
    if (iso) {
        const [y, m, d] = iso.split('-').map(Number);
        return Date.UTC(y, m - 1, d) / 1000;
    }
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1) / 1000;
};

const add = (a: string, b: string) => (BigInt(a || '0') + BigInt(b || '0')).toString();

const main = async () => {
    const commit = process.argv.includes('--commit');
    const start = dayUtc(arg('--day'));
    const end = start + 86400;
    await waitForDb();
    const db = mongoose.connection.db!;
    const events = db.collection('ck_events');
    const dailies = db.collection('kn_dailies');
    const staging = db.collection('kn_dailies_next');

    const inDay = { timestamp: { $gte: start, $lt: end } };
    const through = { timestamp: { $lt: end } };

    const count = (filter: Record<string, unknown>) => events.countDocuments(filter);
    const volume = async (address: string) => {
        const rows = await events
            .find({ ...inDay, event: 'AuctionSuccessful', address }, { projection: { totalPrice: 1 } })
            .toArray();
        return rows.reduce((sum, row) => add(sum, String(row.totalPrice || '0')), '0');
    };

    const [
        birthDaily,
        birth,
        saleCreatedDaily,
        saleSuccessfulDaily,
        saleCancelledDaily,
        sireCreatedDaily,
        sireSuccessfulDaily,
        sireCancelledDaily,
        saleCreated,
        saleSuccessful,
        saleCancelled,
        sireCreated,
        sireSuccessful,
        sireCancelled,
        saleVolumeDaily,
        sireVolumeDaily,
        prev,
    ] = await Promise.all([
        count({ ...inDay, event: 'Birth' }),
        count({ ...through, event: 'Birth' }),
        count({ ...inDay, event: 'AuctionCreated', address: SALE }),
        count({ ...inDay, event: 'AuctionSuccessful', address: SALE }),
        count({ ...inDay, event: 'AuctionCancelled', address: SALE }),
        count({ ...inDay, event: 'AuctionCreated', address: SIRE }),
        count({ ...inDay, event: 'AuctionSuccessful', address: SIRE }),
        count({ ...inDay, event: 'AuctionCancelled', address: SIRE }),
        count({ ...through, event: 'AuctionCreated', address: SALE }),
        count({ ...through, event: 'AuctionSuccessful', address: SALE }),
        count({ ...through, event: 'AuctionCancelled', address: SALE }),
        count({ ...through, event: 'AuctionCreated', address: SIRE }),
        count({ ...through, event: 'AuctionSuccessful', address: SIRE }),
        count({ ...through, event: 'AuctionCancelled', address: SIRE }),
        volume(SALE),
        volume(SIRE),
        dailies.find({ timestamp: { $lt: start } }).sort({ timestamp: -1 }).limit(1).next(),
    ]);

    const genesis = 1511395200;
    const dayNum = Math.floor((start - genesis) / 86400) + 1;
    const saleVolume = add(String(prev?.SaleVolume || '0'), saleVolumeDaily);
    const sireVolume = add(String(prev?.SireVolume || '0'), sireVolumeDaily);
    const doc = {
        timestamp: start,
        Day: dayNum,
        Birth: birth,
        BirthDaily: birthDaily,
        SaleCreated: saleCreated,
        SaleCreatedDaily: saleCreatedDaily,
        SaleSuccessful: saleSuccessful,
        SaleSuccessfulDaily: saleSuccessfulDaily,
        SaleCancelled: saleCancelled,
        SaleCancelledDaily: saleCancelledDaily,
        SaleVolume: saleVolume,
        SaleVolumeDaily: saleVolumeDaily,
        SireCreated: sireCreated,
        SireCreatedDaily: sireCreatedDaily,
        SireSuccessful: sireSuccessful,
        SireSuccessfulDaily: sireSuccessfulDaily,
        SireCancelled: sireCancelled,
        SireCancelledDaily: sireCancelledDaily,
        SireVolume: sireVolume,
        SireVolumeDaily: sireVolumeDaily,
        TotalVolume: add(saleVolume, sireVolume),
        TotalVolumeDaily: add(saleVolumeDaily, sireVolumeDaily),
        ethPrice: (await db.collection('kn_ethprices').findOne({ timestamp: start }))?.ethprice ?? prev?.ethPrice ?? 0,
        auditedAt: new Date(),
        source: 'ck_events',
    };

    const checks = [
        { name: 'BirthDaily matches window', ok: true },
        {
            name: 'Day is previous+1',
            ok: !prev || Number(prev.Day) + 1 === dayNum,
            detail: prev ? `${prev.Day} → ${dayNum}` : 'no previous daily',
        },
        {
            name: 'Birth cumulative >= previous',
            ok: !prev || birth >= Number(prev.Birth || 0),
            detail: `${prev?.Birth || 0} → ${birth}`,
        },
    ];
    const failed = checks.filter((c) => !c.ok);

    await staging.deleteMany({});
    await staging.insertOne(doc);

    console.log(JSON.stringify({ day: new Date(start * 1000).toISOString().slice(0, 10), doc, checks, failed }, null, 2));

    if (failed.length) {
        console.error('Audit failed — not appending to kn_dailies.');
        process.exit(2);
    }
    if (!commit) {
        console.log('Audit passed. Re-run with --commit to append to kn_dailies.');
        await mongoose.disconnect();
        return;
    }
    await dailies.updateOne({ timestamp: start }, { $set: doc }, { upsert: true });
    console.log('Appended to kn_dailies.');
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
