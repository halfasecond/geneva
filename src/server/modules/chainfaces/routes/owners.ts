import express, { Router } from 'express';
import { Model } from 'mongoose';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();

    // Get all owners
    router.get('/', async (req, res) => {
        try {
            const owners = await Models.Owner.find();
            res.json(owners);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get owner by address
    router.get('/:address', async (req, res) => {
        try {
            const owner = await Models.Owner.findOne({ address: req.params.address.toLowerCase() });
            if (!owner) {
                res.status(404).json({ error: 'Owner not found' });
            }
            res.json(owner);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get owner's transaction history
    router.get('/:address/history', async (req, res) => {
        try {
            const events = await Models.Event.find({
                $or: [
                    { from: req.params.address.toLowerCase() },
                    { to: req.params.address.toLowerCase() }
                ],
                event: 'Transfer'
            }).sort({ blockNumber: 1 });
            res.json(events);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get owner's current NFTs
    router.get('/:address/nfts', async (req, res) => {
        try {
            const nfts = await Models.NFT.find({ owner: req.params.address.toLowerCase() });
            res.json(nfts);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
