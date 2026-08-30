/**
 * Rebuild every UTC day from ck_events into kn_dailies_next.
 * Live kn_dailies keep serving. Clock volume is AuctionSuccessful.totalPrice
 * on Sale/Sire. Marketplace volume is Transfer.value from Seaport/Wyvern
 * per-kitty stamps — never tx.value cart totals.
 *
 * Aggregations run in timestamp windows so Mongo can spill to disk instead
 * of grouping the whole ck_events collection in RAM.
 *
 * Usage:
 *   yarn ck:dailies
 *   yarn ck:dailies -- --window-days 90
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Contracts from '../modules/cryptokitties/contracts';
import { AUDIT_ID } from '../modules/cryptokitties/routes/audit';
import { marketplaceSaleQuery } from '../modules/cryptokitties/marketplaceValue';

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

const SALE = Contracts.Sale.addr.toLowerCase();
const SIRE = Contracts.Sire.addr.toLowerCase();
const GENESIS = 1511395200;
const DAY = 86400;
const CLOCK_EVENTS = ['Birth', 'AuctionCreated', 'AuctionSuccessful', 'AuctionCancelled'];

const arg = (name: string, fallback?: string) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? fallback : process.argv[idx + 1];
};

const isoDay = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

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
    MarketplaceSuccessfulDaily: number;
    MarketplaceVolumeDaily: string;
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
    MarketplaceSuccessfulDaily: 0,
    MarketplaceVolumeDaily: '0',
});

const applyClock = (days: Map<number, Bucket>, row: any) => {
    const day = Number(row._id?.day);
    const event = String(row._id?.event || '');
    const addr = String(row._id?.addr || '');
    if (!days.has(day)) return;
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
};

const applyMarket = (days: Map<number, Bucket>, row: any) => {
    const day = Number(row._id);
    if (!days.has(day)) return;
    const bucket = days.get(day)!;
    bucket.MarketplaceSuccessfulDaily += Number(row.n || 0);
    bucket.MarketplaceVolumeDaily = add(bucket.MarketplaceVolumeDaily, asWei(row.vol));
};

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
    const nftsName = (await db.listCollections({ name: 'ck_nfts_next' }).toArray()).length
        ? 'ck_nfts_next'
        : 'ck_nfts';
    const nfts = db.collection(nftsName);
    const audit = db.collection('ck_audit');

    const yesterday = Math.floor(Date.now() / 1000 / DAY) * DAY;
    const windowDays = Math.max(14, Number(arg('--window-days', '90')) || 90);
    const window = windowDays * DAY;
    await audit.updateOne(
        { _id: AUDIT_ID as any },
        {
            $set: {
                note: `Rebuilding kn_dailies_next in ${windowDays}-day windows (clock + marketplace Transfer.value)...`,
                updatedAt: new Date(),
            },
        },
        { upsert: true },
    );

    const days = new Map<number, Bucket>();
    for (let t = GENESIS; t < yesterday; t += DAY) days.set(t, empty());

    const aggOpts = { allowDiskUse: true as const, maxTimeMS: 10 * 60 * 1000 };

    for (let start = GENESIS; start < yesterday; start += window) {
        const end = Math.min(start + window, yesterday);
        const grouped = await events
            .aggregate(
                [
                    {
                        $match: {
                            event: { $in: CLOCK_EVENTS },
                            timestamp: { $gte: start, $lt: end },
                            tokenId: { $ne: 0 },
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
                aggOpts,
            )
            .toArray();
        for (const row of grouped) applyClock(days, row);
        console.log(`[ck:dailies] clock ${isoDay(start)} ${isoDay(end)} groups=${grouped.length}`);
    }

    for (let start = GENESIS; start < yesterday; start += window) {
        const end = Math.min(start + window, yesterday);
        const marketGrouped = await events
            .aggregate(
                [
                    { $match: marketplaceSaleQuery({ timestamp: { $gte: start, $lt: end } }) },
                    {
                        $addFields: {
                            day: { $subtract: ['$timestamp', { $mod: ['$timestamp', DAY] }] },
                        },
                    },
                    {
                        $group: {
                            _id: '$day',
                            n: { $sum: 1 },
                            vol: {
                                $sum: {
                                    $convert: { input: '$value', to: 'decimal', onError: 0, onNull: 0 },
                                },
                            },
                        },
                    },
                ],
                aggOpts,
            )
            .toArray();
        for (const row of marketGrouped) applyMarket(days, row);
        if (marketGrouped.length) {
            console.log(`[ck:dailies] market ${isoDay(start)} ${isoDay(end)} groups=${marketGrouped.length}`);
        }
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
    let marketplaceSuccessful = 0;
    let marketplaceVolume = '0';
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
        marketplaceSuccessful += b.MarketplaceSuccessfulDaily;
        marketplaceVolume = add(marketplaceVolume, b.MarketplaceVolumeDaily);
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
            MarketplaceSuccessful: marketplaceSuccessful,
            MarketplaceSuccessfulDaily: b.MarketplaceSuccessfulDaily,
            MarketplaceVolume: marketplaceVolume,
            MarketplaceVolumeDaily: b.MarketplaceVolumeDaily,
            TotalVolume: add(add(saleVolume, sireVolume), marketplaceVolume),
            TotalVolumeDaily: add(add(b.SaleVolumeDaily, b.SireVolumeDaily), b.MarketplaceVolumeDaily),
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
        console.log(`[ck:dailies] gens snapshot from ${nftsName}`);
    } catch (error) {
        console.warn('[ck:dailies] gens snapshot failed', error);
    }

    const last = docs[docs.length - 1];
    await audit.updateOne(
        { _id: AUDIT_ID as any },
        {
            $set: {
                note: `kn_dailies_next ready. ${docs.length} days, births ${last?.Birth}, clock + marketplace Transfer.value. Live kn_dailies untouched.`,
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
                MarketplaceSuccessful: last?.MarketplaceSuccessful,
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
