import { Express } from 'express';
import { Connection, Schema } from 'mongoose';
import eggMeta from './eggs';

type EggMeta = {
    tokenId: number;
    name?: string;
    description?: string;
    file_name: string;
    tier: string;
    RNG?: number;
};

const meta = eggMeta as EggMeta[];
const byTokenId = new Map(meta.map((egg) => [egg.tokenId, egg]));

const uniqueTiers = [...new Set(meta.map(({ file_name }) => file_name.replace('.png', '')))];
const uniqueTierType = {
    common: uniqueTiers.filter((name) => name.includes('C')).map((name) => Number(name.replace('C', ''))),
    uncommon: uniqueTiers.filter((name) => name.includes('U')).map((name) => Number(name.replace('U', ''))),
    rare: uniqueTiers.filter((name) => name.includes('R')).map((name) => Number(name.replace('R', ''))),
};

const hasCompleteTierSet = (owned: { tierType?: number }[], required: number[]) => {
    const types = owned.map(({ tierType }) => tierType);
    return required.every((type) => types.includes(type));
};

const withMeta = (nft: Record<string, unknown>) => {
    const extra = byTokenId.get(Number(nft.tokenId));
    if (!extra) return nft;
    const tierType = Number(String(extra.file_name).replace(/\D/g, ''));
    return {
        ...nft,
        description: nft.description ?? extra.description,
        name: nft.name ?? extra.name,
        tier: nft.tier ?? extra.tier,
        file_name: extra.file_name,
        rng: nft.rng ?? extra.RNG,
        tierType: nft.tierType ?? tierType,
    };
};

const existing = (db: Connection, name: string) =>
    db.models[name] || db.model(name, new Schema({}, { strict: false, strictQuery: false }), name);

const runModule = ({ app, db }: { app: Express; db: Connection }) => {
    const NFT = existing(db, 'egg_nfts');
    const Owner = existing(db, 'egg_owners');
    const Event = existing(db, 'egg_events');

    app.get('/egg/nfts', async (_req, res) => {
        try {
            const nfts = await NFT.find().select('-_id -__v').sort({ tokenId: -1 }).lean();
            res.json(nfts.map((nft) => withMeta(nft as Record<string, unknown>)));
        } catch (error) {
            console.error('[egg] nfts', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/egg/nfts/:tokenId', async (req, res) => {
        try {
            const nft = await NFT.findOne({ tokenId: Number(req.params.tokenId) }).select('-_id -__v').lean();
            if (!nft) {
                res.status(404).json({ error: 'NFT not found' });
                return;
            }
            res.json(withMeta(nft as Record<string, unknown>));
        } catch (error) {
            console.error('[egg] nft', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/egg/owners', async (_req, res) => {
        try {
            res.json(await Owner.find({ balance: { $gt: 0 } }).select('-_id -__v').lean());
        } catch (error) {
            console.error('[egg] owners', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/egg/owners/eth-eggs', async (req, res) => {
        const ethAddress = req.query.ethAddress;
        if (typeof ethAddress !== 'string' || !ethAddress.startsWith('0x')) {
            res.status(400).json({ error: 'Please provide a valid Ethereum address.' });
            return;
        }
        try {
            const results = (await NFT.find({ owner: ethAddress.toLowerCase() }).lean())
                .map((nft) => withMeta(nft as Record<string, unknown>));
            const common = results.filter(({ tier }) => tier === 'Common');
            const uncommon = results.filter(({ tier }) => tier === 'Uncommon');
            const rare = results.filter(({ tier }) => tier === 'Rare');
            res.json({
                common: {
                    totalOwned: common.length,
                    completedSet: hasCompleteTierSet(common, uniqueTierType.common),
                    tokenIds: common.map(({ tokenId }) => tokenId),
                },
                uncommon: {
                    totalOwned: uncommon.length,
                    completedSet: hasCompleteTierSet(uncommon, uniqueTierType.uncommon),
                    tokenIds: uncommon.map(({ tokenId }) => tokenId),
                },
                rare: {
                    totalOwned: rare.length,
                    completedSet: hasCompleteTierSet(rare, uniqueTierType.rare),
                    tokenIds: rare.map(({ tokenId }) => tokenId),
                },
            });
        } catch (error) {
            console.error('[egg] eth-eggs', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/egg/events', async (req, res) => {
        try {
            const limit = Math.min(parseInt(String(req.query.limit), 10) || 100, 2000);
            const tokenId = req.query.tokenId ? Number(req.query.tokenId) : undefined;
            const query = tokenId ? { tokenId } : {};
            res.json(await Event.find(query).sort({ blockNumber: -1 }).select('-_id -__v').limit(limit).lean());
        } catch (error) {
            console.error('[egg] events', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

export default runModule;
