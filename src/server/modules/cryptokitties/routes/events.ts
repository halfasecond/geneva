import express, { Router } from 'express';
import { CryptoKittiesModels } from '../models';

const routes = (Models: CryptoKittiesModels): Router => {
    const router = express.Router();
    const limit = 1000;
    const sort: Record<string, 1 | -1> = { timestamp: 1 };

    router.get('/', async (req, res) => {
        const query: Record<string, unknown> = {};
        const searchParams = req.query.search;
        if (searchParams && typeof searchParams === 'string') {
            const searchQueryItems = searchParams.split('+');
            searchQueryItems[0].split(' ').forEach((item) => {
                const [key, value] = item.split(':');
                if (key && value !== undefined && key === 'id') {
                    const idRange = value.split('-');
                    if (idRange.length === 2) {
                        query.tokenId = { $gte: Number(idRange[0]), $lte: Number(idRange[1]) };
                    } else {
                        query.tokenId = { $in: value.split(',').map(Number) };
                    }
                }
            });
        }

        try {
            const events = await Models.Event.find(query).sort(sort).select(['-_id', '-__v']).limit(limit).exec();
            if (events) {
                res.status(200).send({ events, total: events.length });
            } else {
                res.status(500).send({ error: 'Internal Server Error' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    return router;
};

export default routes;