import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET } = process.env;

interface Models {
    Account: Model<any>;
    NFT: Model<any>;
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

const verifyOwnedHull = async (Models: Models, address: string, tokenId: number) => {
    return Models.NFT.findOne({ tokenId, owner: address });
};

const routes = (Models: Models): Router => {
    const router = express.Router();

    router.get('/:tokenId', async (req, res) => {
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

            const tokenId = Number(req.params.tokenId);
            if (!Number.isFinite(tokenId)) {
                res.status(400).json({ error: 'Invalid tokenId' });
                return;
            }

            const nft = await verifyOwnedHull(Models, address, tokenId);
            if (!nft) {
                res.status(403).json({ error: 'Hull not owned by wallet' });
                return;
            }

            const doc = await Models.Save.findOne({ walletAddress: address, tokenId });
            if (!doc) {
                res.status(404).json({ error: 'No save found' });
                return;
            }

            const player = doc.player?.toObject?.() ?? doc.player;
            if (player?.cargo instanceof Map) {
                player.cargo = Object.fromEntries(player.cargo);
            }

            res.status(200).json({
                tokenId: doc.tokenId,
                player,
                version: doc.version,
            });
        } catch (error) {
            const err = error as Error;
            console.error('vech save GET error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.put('/:tokenId', async (req, res) => {
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

            const tokenId = Number(req.params.tokenId);
            if (!Number.isFinite(tokenId)) {
                res.status(400).json({ error: 'Invalid tokenId' });
                return;
            }

            const nft = await verifyOwnedHull(Models, address, tokenId);
            if (!nft) {
                res.status(403).json({ error: 'Hull not owned by wallet' });
                return;
            }

            const { player, version = 1 } = req.body ?? {};
            if (!player || typeof player !== 'object') {
                res.status(400).json({ error: 'player required' });
                return;
            }

            const doc = await Models.Save.findOneAndUpdate(
                { walletAddress: address, tokenId },
                {
                    $set: {
                        player,
                        version,
                        lastSeen: new Date(),
                    },
                },
                { upsert: true, new: true },
            );

            res.status(200).json({
                tokenId: doc.tokenId,
                version: doc.version,
                savedAt: doc.lastSeen,
            });
        } catch (error) {
            const err = error as Error;
            console.error('vech save PUT error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

export default routes;