import Web3 from 'web3';
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';

const { JWT_SECRET } = process.env;
const web3 = new Web3(Web3.givenProvider);

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

    router.post('/', async (req, res) => {
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
                // Check if player exists in game state
                const gameState = await Models.GameState.findOne({
                    walletAddress: address.toLowerCase()
                });

                const token = jwt.sign({ userId: recoveredSigner }, JWT_SECRET || 'default-secret');
                const account = await Models.Account.findOneAndUpdate(
                    { address: address.toLowerCase() },
                    { $set: { token } },
                    { upsert: true, new: true }
                );

                // Return token and horse ID if player exists
                res.status(200).json({
                    token,
                    horseId: gameState && gameState.tokenId ? gameState.tokenId : -1
                });
            } else {
                // Authentication failed
                res.status(401).json({ authenticated: false });
            }
        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({ authenticated: false });
        }
    });

    router.post('/check-token', (req, res) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, JWT_SECRET || 'default-secret');
            const { userId } = decoded as { userId: string };
            Models.Account.findOne({ address: userId.toLowerCase(), token }).then(async (account) => {
                if (account) {
                    // Check if player exists in game state
                    const gameState = await Models.GameState.findOne({
                        walletAddress: userId.toLowerCase()
                    });
                    res.status(200).json({ 
                        valid: true,
                        address: userId.toLowerCase(),
                        horseId: gameState && gameState.tokenId ? gameState.tokenId : -1
                    });
                } else {
                    res.status(200).json({ valid: false });
                }
            });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/logout', async (req, res) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, JWT_SECRET || 'default-secret');
            const { userId } = decoded as { userId: string };
            const account = await Models.Account.findOne({ address: userId.toLowerCase(), token });
            if (account) {
                await Models.Account.updateOne({ address: userId.toLowerCase() }, { $unset: { token: 1 } });
                res.status(200).json({ message: 'Logged out successfully.' });
            } else {
                res.status(401).json({ message: 'Invalid token.' });
            }
        } catch (err) {
            const error = err as Error;
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
