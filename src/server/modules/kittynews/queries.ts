import axios from 'axios';
import { Connection, Model } from 'mongoose';
import { KittyNewsModels } from './models';

export interface CkModels {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
}

export function ckModels(db: Connection): CkModels | null {
    const Event = db.models.ck_event;
    const NFT = db.models.ck_nft;
    const Owner = db.models.ck_owner;
    if (!Event || !NFT || !Owner) return null;
    return { Event, NFT, Owner };
}

const FEED_LIMIT = 20;
const QUERY_MS = 8000;
const FLOOR_TTL_MS = 60_000;
const NO_ID = { projection: { _id: 0, __v: 0 } as const, maxTimeMS: QUERY_MS };

const DAILY_PROJECTION = {
    Day: 1,
    Birth: 1,
    BirthDaily: 1,
    SaleSuccessful: 1,
    SaleSuccessfulDaily: 1,
    SaleCancelled: 1,
    SaleCancelledDaily: 1,
    SaleCreated: 1,
    SaleCreatedDaily: 1,
    SaleVolume: 1,
    SaleVolumeDaily: 1,
    SireSuccessful: 1,
    SireSuccessfulDaily: 1,
    SireCancelled: 1,
    SireCancelledDaily: 1,
    SireCreated: 1,
    SireCreatedDaily: 1,
    SireVolume: 1,
    SireVolumeDaily: 1,
    TotalVolumeDaily: 1,
    TotalVolume: 1,
    timestamp: 1,
    ethPrice: 1,
    _id: 0,
} as const;

export type FloorRow = { tokenId: number; price: string };
export type FloorMap = Record<string, FloorRow>;

function native(db: Connection, name: string) {
    return db.db?.collection(name) ?? null;
}

function share<T>(slot: { current: Promise<T> | null }, run: () => Promise<T>): Promise<T> {
    if (!slot.current) {
        slot.current = run().finally(() => {
            slot.current = null;
        });
    }
    return slot.current;
}

export function newsQueries(Models: KittyNewsModels, db: Connection) {
    const nfts = () => native(db, 'ck_nfts');
    const events = () => native(db, 'ck_events');
    const owners = () => native(db, 'ck_owners');

    const dailies = () => Models.Daily.find({}, DAILY_PROJECTION).sort({ timestamp: -1 }).lean();

    const cmsList = (type?: string) => {
        const filter = type ? { contentType: type } : {};
        return Models.Cms.find(filter).sort({ publishedDate: -1 }).lean();
    };

    const cmsBySlug = (slug: string) => Models.Cms.findOne({ slug }).lean();

    const ethprices = () => Models.EthPrice.find({}).sort({ timestamp: 1 }).select('-_id -__v').lean();

    const auctions = async () => {
        const col = events();
        if (!col) return [];
        return col
            .find({ event: 'AuctionSuccessful' }, NO_ID)
            .sort({ blockNumber: -1, logIndex: -1 })
            .limit(FEED_LIMIT)
            .toArray();
    };

    const auctionsuccess = async () => {
        const eventCol = events();
        const nftCol = nfts();
        if (!eventCol || !nftCol) return [];
        const rows = await eventCol
            .find({ event: 'AuctionSuccessful' }, NO_ID)
            .sort({ blockNumber: -1, logIndex: -1 })
            .limit(FEED_LIMIT)
            .toArray();
        return Promise.all(
            rows.map(async (auction) => {
                const kitty = await nftCol.findOne(
                    { tokenId: Number(auction.tokenId) },
                    { projection: { _id: 0, __v: 0 }, maxTimeMS: QUERY_MS },
                );
                return { ...auction, kitty };
            }),
        );
    };

    const transfersSlot: { current: Promise<unknown> | null } = { current: null };
    const transfers = () =>
        share(transfersSlot, async () => {
            const eventCol = events();
            const nftCol = nfts();
            if (!eventCol || !nftCol) return [];
            const rows = await eventCol
                .find({ event: 'AuctionSuccessful' }, NO_ID)
                .sort({ blockNumber: -1, logIndex: -1 })
                .limit(FEED_LIMIT)
                .toArray();
            return Promise.all(
                rows.map(async (auction) => {
                    const kitty = await nftCol.findOne(
                        { tokenId: Number(auction.tokenId) },
                        { projection: { _id: 0, __v: 0 }, maxTimeMS: QUERY_MS },
                    );
                    return {
                        ...auction,
                        value: auction.totalPrice,
                        kitty,
                        auction,
                    };
                }),
            );
        });

    const birthsSlot: { current: Promise<unknown> | null } = { current: null };
    const births = () =>
        share(birthsSlot, async () => {
            const col = nfts();
            if (!col) return [];
            return col
                .find({}, NO_ID)
                .sort({ tokenId: -1 })
                .limit(FEED_LIMIT)
                .toArray();
        });

    const reportSlot: { current: Promise<unknown> | null } = { current: null };
    const latestReport = () =>
        share(reportSlot, async () => {
            const ownerCol = owners();
            const [daily, ownerCount] = await Promise.all([
                Models.Daily.findOne({}, { cattributes: 0, __v: 0, _id: 0 }).sort({ timestamp: -1 }).lean(),
                ownerCol
                    ? ownerCol.countDocuments({ balance: { $gt: 0 } })
                    : Promise.resolve(0),
            ]);
            return { ...(daily ?? {}), owners: ownerCount };
        });

    const cheapestSale = async (
        filter: Record<string, unknown>,
        hint?: Record<string, 1>,
    ): Promise<FloorRow | undefined> => {
        const col = nfts();
        if (!col) return undefined;
        try {
            const row = await col.findOne(
                { ...filter, currentPrice: { $exists: true, $nin: [null, ''] } },
                {
                    projection: { tokenId: 1, currentPrice: 1 },
                    sort: { currentPrice: 1 },
                    maxTimeMS: QUERY_MS,
                    ...(hint ? { hint } : {}),
                },
            );
            if (row?.tokenId == null || row.currentPrice == null) return undefined;
            return { tokenId: Number(row.tokenId), price: unPadAndFormatPrice(String(row.currentPrice)) };
        } catch (error) {
            console.error('[kittynews] cheapest sale', JSON.stringify(filter), error);
            return undefined;
        }
    };

    const SALE_PRICE = { sale: 1, currentPrice: 1 };
    const SIRE_PRICE = { sire: 1, currentPrice: 1 };

    const mongoFloorsSlot: { current: Promise<FloorMap> | null } = { current: null };
    const mongoFloors = () =>
        share(mongoFloorsSlot, async () => {
            const [sale, sire, gen0, gen0virgin, founders, day1, born2017] = await Promise.all([
                cheapestSale({ sale: true }, SALE_PRICE),
                cheapestSale({ sire: true }, SIRE_PRICE),
                cheapestSale({ sale: true, gen: 0 }, SALE_PRICE),
                cheapestSale({ sale: true, gen: 0, offspring: 0 }, SALE_PRICE),
                cheapestSale({ sale: true, tokenId: { $lte: 100 } }, SALE_PRICE),
                cheapestSale({ sale: true, tokenId: { $lte: 3365 } }, SALE_PRICE),
                cheapestSale({ sale: true, tokenId: { $lte: 438_354 } }, SALE_PRICE),
            ]);
            const floor: FloorMap = {};
            if (sale) floor.sale = sale;
            if (sire) floor.sire = sire;
            if (gen0) floor.gen0 = gen0;
            if (gen0virgin) floor.gen0virgin = gen0virgin;
            if (founders) floor.founders = founders;
            if (day1) floor.day1 = day1;
            if (born2017) floor.born2017 = born2017;
            return floor;
        });

    const apiFloorsSlot: { current: Promise<FloorMap> | null } = { current: null };
    const apiFloors = () =>
        share(apiFloorsSlot, async () => {
            const rows = await Promise.all(
                CK_API_FLOORS.map(async ({ key, search }) => {
                    const row = await ckApiFloor(search);
                    return [key, row] as const;
                }),
            );
            const floor: FloorMap = {};
            for (const [key, row] of rows) {
                if (row) floor[key] = row;
            }
            return floor;
        });

    let floorCache: FloorMap | null = null;
    let floorAt = 0;
    const floorsSlot: { current: Promise<FloorMap> | null } = { current: null };
    const floors = () => {
        if (floorCache && Date.now() - floorAt < FLOOR_TTL_MS) return Promise.resolve(floorCache);
        return share(floorsSlot, async () => {
            const [mongo, api] = await Promise.all([mongoFloors(), apiFloors()]);
            floorCache = { ...mongo, ...api };
            floorAt = Date.now();
            return floorCache;
        });
    };

    return {
        dailies,
        cmsList,
        cmsBySlug,
        ethprices,
        auctions,
        auctionsuccess,
        transfers,
        births,
        latestReport,
        mongoFloors,
        apiFloors,
        floors,
    };
}

const CK_API = 'https://api.cryptokitties.co/v3/kitties';
const CK_API_FLOORS = [
    { key: 'diamond', search: 'mewtation:diamond' },
    { key: 'gilded', search: 'mewtation:gilded' },
    { key: 'amethyst', search: 'mewtation:amethyst' },
    { key: 'lapis', search: 'mewtation:lapis' },
    { key: 'fancy', search: 'type:fancy' },
    { key: 'exclusive', search: 'type:exclusive' },
    { key: 'purrstige', search: 'type:purrstige' },
    { key: 'specialedition', search: 'type:specialedition' },
    { key: 'shinyfancy', search: 'type:shinyfancy' },
] as const;

async function ckApiFloor(search: string): Promise<FloorRow | undefined> {
    try {
        const url = `${CK_API}?include=sale&search=${search}&orderBy=current_price&orderDirection=asc&offset=0&limit=1`;
        const { data } = await axios.get(url, { timeout: 8000 });
        const kitty = data?.kitties?.[0] as { id?: number; auction?: { current_price?: string } } | undefined;
        if (!kitty?.id || !kitty.auction?.current_price) return undefined;
        return { tokenId: kitty.id, price: fromWei(String(kitty.auction.current_price)) };
    } catch (error) {
        console.error('[kittynews] ck api floor', search, error);
        return undefined;
    }
}

function unPadAndFormatPrice(price: string): string {
    const trimmed = price.replace(/^0+/, '');
    return trimmed === '' ? '0' : fromWei(trimmed);
}

function fromWei(wei: string): string {
    const value = BigInt(wei);
    const scale = 10n ** 18n;
    const whole = value / scale;
    const frac = value % scale;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '');
    const decimals = fracStr.length <= 3 ? fracStr : fracStr.slice(0, 4);
    return `${whole}.${decimals}`;
}
