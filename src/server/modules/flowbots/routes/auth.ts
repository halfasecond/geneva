import Web3 from 'web3';
import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Models } from './index';
import dotenv from 'dotenv';
dotenv.config();

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Initialize Web3 without a provider since we only need it for account recovery
const web3: any = new (Web3 as any)();

const routes = (Models: Models): Router => {
    const router = express.Router();

    router.post('/', async (req: Request, res: Response) => {
        const { address, signature, message } = req.body;
        try {
            // Recover the signer's address from the signature
            const recoveredSigner = web3.eth.accounts.recover(
                message,
                signature,
                ''
            );
            // Check if the recovered address matches the expected signer's address
            if (recoveredSigner.toLowerCase() === address.toLowerCase()) {
                const token = jwt.sign({ userId: recoveredSigner }, JWT_SECRET);
                const account = await Models.Account.findOneAndUpdate(
                    { address: address.toLowerCase() },
                    { $set: { token } },
                    { upsert: true, new: true }
                );
                res.status(200).json({ token });
            } else {
                // Authentication failed
                res.status(401).json({ authenticated: false });
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            res.status(500).json({ authenticated: false });
        }
    });

    router.post('/check-token', (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            const { userId } = decoded;
            Models.Account.findOne({ address: userId.toLowerCase(), token }).then((account) => {
                if (account) {
                    res.status(200).json({ valid: true, address: userId.toLowerCase() });
                } else {
                    res.status(200).json({ valid: false });
                }
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/logout', async (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOne({ address: userId.toLowerCase(), token });
            if (account) {
                await Models.Account.updateOne(
                    { address: userId.toLowerCase() },
                    { $unset: { token: 1 } }
                );
                res.status(200).json({ message: 'Logged out successfully.' });
            } else {
                res.status(401).json({ message: 'Invalid token.' });
            }
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

export default routes;
