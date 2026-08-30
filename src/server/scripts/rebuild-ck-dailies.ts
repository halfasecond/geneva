/**
 * Rebuild every UTC day from ck_events into kn_dailies_next.
 * Live kn_dailies keep serving. Volume is CK clock AuctionSuccessful.totalPrice
 * on Sale/Sire only — not Transfer.value (OpenSea/Wyvern carts).
 *
 * Usage:
 *   yarn ck:dailies
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Contracts from '../modules/cryptokitties/contracts';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();
const GENESIS = 1511395200;
const DAY = 86400;

const waitForDb = () =>
    new Promise<void>((resolve, reject) => {
        const uri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva';
        mongoose.connect(uri).catch(reject);
        mongoose.connection.once('open', () => resolve());
        mongoose.connection.once('error', reject);
    });

const add = (a: string, b: string) => (BigInt(a || '0') + BigInt(b || '0')).toString();
const asWei = (value: unknown) => {
    const raw = String(value ?? '0').split('.')[0];
    try {
        return BigInt(raw || '0').toString();
    } catch {
        return '0';
    }
};

type Bucket = {
    BirthDaily: number;
    SaleCreatedDaily: number;
    SaleSuccessfulDaily: number;
    SaleCancelledDaily: number;
    SireCreatedDaily: number;
    SireSuccessfulDaily: number;
    SireCancelledDaily: number;
    SaleVolumeDaily: string;
    SireVolumeDaily: string;
};

const empty = (): Bucket => ({
    BirthDaily: 0,
    SaleCreatedDaily: 0,
    SaleSuccessfulDaily: 0,
    SaleCancelledDaily: 0,
    SireCreatedDaily: 0,
    SireSuccessfulDaily: 0,
    SireCancelledDaily: 0,
    SaleVolumeDaily: '0',
    SireVolumeDaily: '0',
});

const gensFromNfts = async (nfts: any) => {
    const rows = await nfts
        .aggregate([{ $group: { _id: '$gen', n: { $sum: 1 } } }], { allowDiskUse: true })
        .toArray();
    const byGen = new Map<number, number>();
    let highestGen = 0;
    for (const row of rows) {
        const gen = Number(row._id || 0);
        byGen.set(gen, Number(row.n || 0));
        if (gen > highestGen) highestGen = gen;
    }
    const gens: Record<string, number> = { highestGen };
    let gen26etc = 0;
    for (const [gen, n] of byGen) {
        if (gen >= 26) gen26etc += n;
        if (gen >= 0 && gen <= 25) gens[`gen${gen}`] = n;
    }
    gens.gen26etc = gen26etc;
    gens.gen100 = byGen.get(100) || 0;
    gens.gen1000 = byGen.get(1000) || 0;
    gens.gen10000 = byGen.get(10000) || 0;
    return gens;
};

const main = async () => {
    await waitForDb();
    const db = mongoose.connection.db!;
    const events = db.collection('ck_events');
    const staging = db.collection('kn_dailies_next');
    const prices = db.collection('kn_ethprices');
    const nfts = db.collection('ck_nfts_next');
    const audit = db.collection('ck_audit');

    const yesterday = Math.floor(Date.now() / 1000 / DAY) * DAY;
    await audit.updateOne(
        { _id: AUDIT_ID as any },
        { $set: { note: 'Rebuilding kn_dailies_next from ck_events (CK auctions only)...', updatedAt: new Date() } },
        { upsert: true },
    );

    const grouped = await events
        .aggregate(
            [
                {
                    $match: {
                        event: { $in: ['Birth', 'AuctionCreated', 'AuctionSuccessful', 'AuctionCancelled'] },
                    },
                },
                {
                    $addFields: {
                        day: { $subtract: ['$timestamp', { $mod: ['$timestamp', DAY] }] },
                        addr: { $toLower: { $ifNull: ['$address', ''] } },
                    },
                },
                {
                    $group: {
                        _id: { day: '$day', event: '$event', addr: '$addr' },
                        n: { $sum: 1 },
                        vol: {
                            $sum: {
                                $convert: { input: '$totalPrice', to: 'decimal', onError: 0, onNull: 0 },
                            },
                        },
                    },
                },
            ],
            { allowDiskUse: true },
        )
        .toArray();

    const days = new Map<number, Bucket>();
    for (let t = GENESIS; t < yesterday; t += DAY) days.set(t, empty());

    for (const row of grouped) {
        const day = Number(row._id?.day);
        const event = String(row._id?.event || '');
        const addr = String(row._id?.addr || '');
        if (!days.has(day)) continue;
        const bucket = days.get(day)!;
        const n = Number(row.n || 0);
        const vol = asWei(row.vol);
        if (event === 'Birth') bucket.BirthDaily += n;
        if (event === 'AuctionCreated' && addr === SALE) bucket.SaleCreatedDaily += n;
        if (event === 'AuctionSuccessful' && addr === SALE) {
            bucket.SaleSuccessfulDaily += n;
            bucket.SaleVolumeDaily = add(bucket.SaleVolumeDaily, vol);
        }
        if (event === 'AuctionCancelled' && addr === SALE) bucket.SaleCancelledDaily += n;
        if (event === 'AuctionCreated' && addr === SIRE) bucket.SireCreatedDaily += n;
        if (event === 'AuctionSuccessful' && addr === SIRE) {
            bucket.SireSuccessfulDaily += n;
            bucket.SireVolumeDaily = add(bucket.SireVolumeDaily, vol);
        }
        if (event === 'AuctionCancelled' && addr === SIRE) bucket.SireCancelledDaily += n;
    }

    const priceRows = await prices.find({}, { projection: { timestamp: 1, ethprice: 1 } }).toArray();
    const priceByTs = new Map(priceRows.map((row) => [Number(row.timestamp), Number(row.ethprice || 0)]));

    let birth = 0;
    let saleCreated = 0;
    let saleSuccessful = 0;
    let saleCancelled = 0;
    let sireCreated = 0;
    let sireSuccessful = 0;
    let sireCancelled = 0;
    let saleVolume = '0';
    let sireVolume = '0';
    let lastPrice = 0;
    const docs: Record<string, unknown>[] = [];
    const sortedDays = [...days.keys()].sort((a, b) => a - b);

    for (const timestamp of sortedDays) {
        const b = days.get(timestamp)!;
        birth += b.BirthDaily;
        saleCreated += b.SaleCreatedDaily;
        saleSuccessful += b.SaleSuccessfulDaily;
        saleCancelled += b.SaleCancelledDaily;
        sireCreated += b.SireCreatedDaily;
        sireSuccessful += b.SireSuccessfulDaily;
        sireCancelled += b.SireCancelledDaily;
        saleVolume = add(saleVolume, b.SaleVolumeDaily);
        sireVolume = add(sireVolume, b.SireVolumeDaily);
        if (priceByTs.has(timestamp)) lastPrice = priceByTs.get(timestamp)!;
        docs.push({
            timestamp,
            Day: Math.floor((timestamp - GENESIS) / DAY) + 1,
            Birth: birth,
            BirthDaily: b.BirthDaily,
            SaleCreated: saleCreated,
            SaleCreatedDaily: b.SaleCreatedDaily,
            SaleSuccessful: saleSuccessful,
            SaleSuccessfulDaily: b.SaleSuccessfulDaily,
            SaleCancelled: saleCancelled,
            SaleCancelledDaily: b.SaleCancelledDaily,
            SaleVolume: saleVolume,
            SaleVolumeDaily: b.SaleVolumeDaily,
            SireCreated: sireCreated,
            SireCreatedDaily: b.SireCreatedDaily,
            SireSuccessful: sireSuccessful,
            SireSuccessfulDaily: b.SireSuccessfulDaily,
            SireCancelled: sireCancelled,
            SireCancelledDaily: b.SireCancelledDaily,
            SireVolume: sireVolume,
            SireVolumeDaily: b.SireVolumeDaily,
            TotalVolume: add(saleVolume, sireVolume),
            TotalVolumeDaily: add(b.SaleVolumeDaily, b.SireVolumeDaily),
            ethPrice: lastPrice,
            source: 'ck_events',
            auditedAt: new Date(),
        });
    }

    await staging.deleteMany({});
    const CHUNK = 500;
    for (let i = 0; i < docs.length; i += CHUNK) {
        await staging.insertMany(docs.slice(i, i + CHUNK));
    }

    try {
        const gens = await gensFromNfts(nfts);
        const lastTs = sortedDays[sortedDays.length - 1];
        await staging.updateOne({ timestamp: lastTs }, { $set: { gens } });
    } catch (error) {
        console.warn('[ck:dailies] gens snapshot failed', error);
    }

    const last = docs[docs.length - 1];
    await audit.updateOne(
        { _id: AUDIT_ID as any },
        {
            $set: {
                note: `kn_dailies_next ready. ${docs.length} days, births ${last?.Birth}, saleVol days from CK clock only. Live kn_dailies untouched.`,
                dailiesDays: docs.length,
                updatedAt: new Date(),
            },
        },
        { upsert: true },
    );
    console.log(
        JSON.stringify(
            {
                days: docs.length,
                first: docs[0]?.timestamp,
                last: last?.timestamp,
                Birth: last?.Birth,
                SaleSuccessful: last?.SaleSuccessful,
                SireSuccessful: last?.SireSuccessful,
            },
            null,
            2,
        ),
    );
    await mongoose.disconnect();
};

main().catch((error) => {
    console.error('[ck:dailies] failed', error);
    process.exit(1);
});
