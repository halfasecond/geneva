import express, { Router } from 'express';
import { Model } from 'mongoose';

interface Models {
    Account: Model<any>;
    Event: Model<any>;
    Balance: Model<any>;
    Claim: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();

    // Get events with pagination
    router.get('/', async (req, res) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            const events = await Models.Event
                .find()
                .sort({ blockNumber: -1, timestamp: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Models.Event.countDocuments();

            res.json({
                events,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get events for specific address
    router.get('/address/:address', async (req, res) => {
        try {
            const events = await Models.Event
                .find({
                    $or: [
                        { from: req.params.address.toLowerCase() },
                        { to: req.params.address.toLowerCase() }
                    ]
                })
                .sort({ blockNumber: -1, timestamp: -1 });
            res.json(events);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
