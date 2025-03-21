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

    // Get claim status for address
    router.get('/:address', async (req, res) => {
        try {
            const claim = await Models.Claim.findOne({ address: req.params.address.toLowerCase() });
            res.json(claim || { address: req.params.address.toLowerCase(), claimed: false });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
