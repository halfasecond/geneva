import express, { Router } from 'express';
import { Model } from 'mongoose';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();

    // Get all NFTs
    router.get('/', async (req, res) => {
        try {
            const nfts = await Models.NFT.find();
            res.json(nfts);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get NFT by tokenId
    router.get('/:tokenId', async (req, res) => {
        try {
            const nft = await Models.NFT.findOne({ tokenId: Number(req.params.tokenId) });
            if (!nft) {
                res.status(404).json({ error: 'NFT not found' });
            }
            res.json(nft);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get NFTs by owner address
    router.get('/owner/:address', async (req, res) => {
        try {
            const nfts = await Models.NFT.find({ owner: req.params.address.toLowerCase() });
            res.json(nfts);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    // Get NFT history (all events for a tokenId)
    router.get('/:tokenId/history', async (req, res) => {
        try {
            const events = await Models.Event.find({ 
                tokenId: Number(req.params.tokenId),
                event: 'Transfer'
            }).sort({ blockNumber: 1 });
            res.json(events);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
