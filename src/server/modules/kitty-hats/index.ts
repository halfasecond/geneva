import { Express } from 'express';
import { Connection, Schema } from 'mongoose';

const HIDDEN_HAT = 'Kitties for a Cause Exclusive';
const EVENT_LIMIT = 1000;

const hatSchema = new Schema(
    { itemName: String, itemType: String, contract: String, tokenAddress: String },
    { strict: false, strictQuery: false, timestamps: true },
);

const eventSchema = new Schema(
    {
        blockNumber: Number,
        transactionHash: String,
        tokenId: Number,
        from: String,
        to: String,
        timestamp: Number,
        event: String,
        address: String,
    },
    { strict: false, strictQuery: false, timestamps: true },
);
eventSchema.index({ tokenId: 1 });

function idFromSearch(search?: string) {
    if (!search) return undefined;
    for (const item of search.replace(/\+/g, ' ').split(' ').filter(Boolean)) {
        const [key, value] = item.split(':');
        if (key === 'id' && value !== undefined) {
            if (value.includes(',')) return { $in: value.split(',').map(Number) };
            const range = value.split('-');
            if (range.length === 2) return { $gte: Number(range[0]), $lte: Number(range[1]) };
            return { $eq: Number(value) };
        }
    }
    return undefined;
}

const runModule = ({ app, db }: { app: Express; db: Connection }) => {
    const Hats = db.models.kh_hats || db.model('kh_hats', hatSchema, 'kh_hats');
    const Event = db.models.kh_events || db.model('kh_events', eventSchema, 'kh_events');

    app.get('/kitty-hats/hats', async (_req, res) => {
        try {
            res.json(await Hats.find({ itemName: { $ne: HIDDEN_HAT } }).select('-_id -__v').lean());
        } catch (error) {
            console.error('[kitty-hats] hats', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kitty-hats-events', async (req, res) => {
        try {
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;
            const tokenId = idFromSearch(search);
            const query = tokenId ? { tokenId } : {};
            const hats = await Event.find(query).sort({ timestamp: 1 }).select('-_id -__v').limit(EVENT_LIMIT).lean();
            res.json({ hats });
        } catch (error) {
            console.error('[kitty-hats] events', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

export default runModule;
