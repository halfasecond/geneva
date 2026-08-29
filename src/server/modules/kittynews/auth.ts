import Web3 from 'web3';
import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { KittyNewsModels } from './models';

const web3: any = new (Web3 as any)();
const secret = () => process.env.JWT_SECRET || 'default-secret';

const routes = (Models: KittyNewsModels): Router => {
    const router = express.Router();

    router.post('/', async (req: Request, res: Response) => {
        const { address, signature, message } = req.body;
        try {
            const recoveredSigner = web3.eth.accounts.recover(message, signature, '');
            if (recoveredSigner.toLowerCase() !== address.toLowerCase()) {
                res.status(401).json({ authenticated: false });
                return;
            }
            const token = jwt.sign({ userId: recoveredSigner }, secret());
            await Models.Account.findOneAndUpdate(
                { address: address.toLowerCase() },
                { $set: { token } },
                { upsert: true, new: true },
            );
            res.status(200).json({ token });
        } catch (error) {
            console.error('[kittynews-auth] login', error);
            res.status(500).json({ authenticated: false });
        }
    });

    router.post('/check-token', async (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const account = await Models.Account.findOne({ address: decoded.userId.toLowerCase(), token });
            if (!account) {
                res.status(200).json({ valid: false });
                return;
            }
            res.status(200).json({ valid: true, address: decoded.userId.toLowerCase() });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/logout', async (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const account = await Models.Account.findOne({ address: decoded.userId.toLowerCase(), token });
            if (!account) {
                res.status(401).json({ message: 'Invalid token.' });
                return;
            }
            await Models.Account.updateOne({ address: decoded.userId.toLowerCase() }, { $unset: { token: 1 } });
            res.status(200).json({ message: 'Logged out successfully.' });
        } catch (err) {
            const error = err as Error;
            console.error('[kittynews-auth] logout', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
