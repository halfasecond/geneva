import Web3 from 'web3';
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET } = process.env;
const web3 = new Web3();

interface Models {
    Account: Model<any>;
    PlayerState: Model<any>;
    NFT: Model<any>;
    [key: string]: Model<any>;
}

const verifySession = async (token: string, Models: Models) => {
    const decoded = jwt.verify(token, JWT_SECRET || 'default-secret') as { userId: string };
    const address = decoded.userId.toLowerCase();
    const account = await Models.Account.findOne({ address, token });
    if (!account) return null;
    return address;
};

const currentShipTokenId = async (Models: Models, address: string) => {
    const playerState = await Models.PlayerState.findOne({ walletAddress: address });
    return playerState?.tokenId ?? -1;
};

const routes = (Models: Models): Router => {
    const router = express.Router();

    router.post('/', async (req, res) => {
        const { address, signature, message } = req.body;
        try {
            const recoveredSigner = web3.eth.accounts.recover(message, signature, '');
            if (recoveredSigner.toLowerCase() !== address.toLowerCase()) {
                res.status(401).json({ authenticated: false });
                return;
            }

            const walletAddress = address.toLowerCase();
            const token = jwt.sign({ userId: recoveredSigner }, JWT_SECRET || 'default-secret');
            await Models.Account.findOneAndUpdate(
                { address: walletAddress },
                { $set: { token } },
                { upsert: true, new: true },
            );

            res.status(200).json({
                token,
                tokenId: await currentShipTokenId(Models, walletAddress),
            });
        } catch (error) {
            console.error('vech auth verification error:', error);
            res.status(500).json({ authenticated: false });
        }
    });

    router.post('/check-token', async (req, res) => {
        const { token } = req.body;
        try {
            const address = await verifySession(token, Models);
            if (!address) {
                res.status(200).json({ valid: false });
                return;
            }

            res.status(200).json({
                valid: true,
                address,
                tokenId: await currentShipTokenId(Models, address),
            });
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/select-ship', async (req, res) => {
        const { token, tokenId } = req.body;
        try {
            const address = await verifySession(token, Models);
            if (!address) {
                res.status(401).json({ error: 'Invalid session' });
                return;
            }

            const nft = await Models.NFT.findOne({
                tokenId: Number(tokenId),
                owner: address,
            });

            if (!nft) {
                res.status(403).json({ error: 'Ship not owned by wallet' });
                return;
            }

            await Models.PlayerState.findOneAndUpdate(
                { walletAddress: address },
                {
                    tokenId: nft.tokenId,
                    shipId: nft.shipId,
                    lastSeen: new Date(),
                },
                { upsert: true, new: true },
            );

            res.status(200).json({
                tokenId: nft.tokenId,
                shipId: nft.shipId,
                name: nft.name,
                animation_url: nft.animation_url,
            });
        } catch (error) {
            const err = error as Error;
            console.error('vech select-ship error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/logout', async (req, res) => {
        const { token } = req.body;
        try {
            const address = await verifySession(token, Models);
            if (!address) {
                res.status(401).json({ message: 'Invalid token.' });
                return;
            }

            await Models.Account.updateOne({ address }, { $unset: { token: 1 } });
            res.status(200).json({ message: 'Logged out successfully.' });
        } catch (error) {
            const err = error as Error;
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

export default routes;