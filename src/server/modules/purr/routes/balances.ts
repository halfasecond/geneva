import express, { Router } from 'express';
import { Model } from 'mongoose';
import { erc20BalanceOf, resolveRpcUrl } from '../../../indexer';
import Contracts from '../contracts';

interface Models {
    Account: Model<any>;
    Event: Model<any>;
    Balance: Model<any>;
    Claim: Model<any>;
    [key: string]: Model<any>;
}

const routes = (Models: Models): Router => {
    const router = express.Router();

    // Claim-pool / wallet balances for logged-out clients. No user wallet.
    // Dump rows are stale (indexer skips large getLogs gaps), so read chain via
    // the server RPC and persist so live Transfer follow stays on the right base.
    router.get('/:address', async (req, res) => {
        const address = req.params.address.toLowerCase();
        try {
            const { http } = resolveRpcUrl();
            const live = await erc20BalanceOf(http, Contracts.Core.addr, address);
            await Models.Balance.updateOne(
                { address },
                { $set: { address, balance: live, lastUpdated: new Date() } },
                { upsert: true },
            );
            return res.json({ address, balance: live });
        } catch (error) {
            console.error('[purr] balanceOf via RPC failed, falling back to mongo', error);
        }
        try {
            const balance = await Models.Balance.findOne({ address });
            res.json(balance || { address, balance: '0' });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
