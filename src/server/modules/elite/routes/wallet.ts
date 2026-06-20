import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import dotenv from 'dotenv';
import { resolveWalletCredits } from '../walletCredits';

dotenv.config();

const { JWT_SECRET } = process.env;

interface Models {
    Account: Model<any>;
    Save: Model<any>;
    [key: string]: Model<any>;
}

const verifySession = async (token: string, Models: Models) => {
    const decoded = jwt.verify(token, JWT_SECRET || 'default-secret') as { userId: string };
    const address = decoded.userId.toLowerCase();
    const account = await Models.Account.findOne({ address, token });
    if (!account) return null;
    return address;
};

const authHeaderToken = (req: express.Request): string | null => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
};

const routes = (Models: Models): Router => {
    const router = express.Router();

    router.get('/credits', async (req, res) => {
        const sessionToken = authHeaderToken(req);
        if (!sessionToken) {
            res.status(401).json({ error: 'Missing session' });
            return;
        }

        try {
            const address = await verifySession(sessionToken, Models);
            if (!address) {
                res.status(401).json({ error: 'Invalid session' });
                return;
            }

            const credits = await resolveWalletCredits(Models, address);
            res.status(200).json({ credits });
        } catch (error) {
            const err = error as Error;
            console.error('vech wallet credits GET error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

export default routes;