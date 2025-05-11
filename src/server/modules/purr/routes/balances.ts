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

    // Get balance for address
    router.get('/:address', async (req, res) => {
        try {
            const balance = await Models.Balance.findOne({ address: req.params.address.toLowerCase() });
            res.json(balance || { address: req.params.address.toLowerCase(), balance: '0' });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
