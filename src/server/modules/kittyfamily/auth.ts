import Web3 from 'web3';
import express, { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Connection } from 'mongoose';
import { KittyFamilyModels } from './models';

const { JWT_SECRET } = process.env;
const web3: any = new (Web3 as any)();

const secret = () => JWT_SECRET || 'default-secret';

const userPayload = async (account: any, db: Connection, userId: string, extra: Record<string, unknown> = {}) => {
    const owner = await db.collection('ck_owners').findOne({ owner: userId.toLowerCase() });
    return {
        valid: true,
        avatar: extra.avatar ?? account?.avatar ?? -1,
        followers: account?.followers ?? [],
        following: account?.following ?? [],
        displayName: extra.displayName ?? account?.displayName,
        balance: owner?.balance ?? 0,
        birthed: owner?.birthed ?? 0,
        balanceAll: owner?.balanceAll ?? 0,
        address: userId.toLowerCase(),
        ...extra,
    };
};

const routes = (Models: KittyFamilyModels, db: Connection): Router => {
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
            const account = await Models.Account.findOneAndUpdate(
                { address: address.toLowerCase() },
                { $set: { token } },
                { upsert: true, new: true },
            );
            const payload = await userPayload(account, db, recoveredSigner, { token });
            res.status(200).json(payload);
        } catch (error) {
            console.error('[kittyfamily-auth] login', error);
            res.status(500).json({ authenticated: false });
        }
    });

    router.post('/check-token', async (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOne({ address: userId.toLowerCase(), token });
            if (!account) {
                res.status(200).json({ valid: false });
                return;
            }
            res.status(200).json(await userPayload(account, db, userId));
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/logout', async (req: Request, res: Response) => {
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOne({ address: userId.toLowerCase(), token });
            if (!account) {
                res.status(401).json({ message: 'Invalid token.' });
                return;
            }
            await Models.Account.updateOne({ address: userId.toLowerCase() }, { $unset: { token: 1 } });
            res.status(200).json({ message: 'Logged out successfully.' });
        } catch (err) {
            const error = err as Error;
            console.error('[kittyfamily-auth] logout', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/avatar', async (req: Request, res: Response) => {
        const { token, tokenId } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOneAndUpdate(
                { address: userId.toLowerCase() },
                { $set: { avatar: tokenId } },
                { new: true },
            );
            if (!account) {
                res.status(200).json({ valid: false });
                return;
            }
            res.status(200).json(await userPayload(account, db, userId, { avatar: tokenId }));
        } catch (err) {
            const error = err as Error;
            console.error('[kittyfamily-auth] avatar', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/info', async (req: Request, res: Response) => {
        const displayName = req.body?.formInfo?.displayName;
        const { token } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOneAndUpdate(
                { address: userId.toLowerCase() },
                { $set: { displayName } },
                { new: true },
            );
            if (!account) {
                res.status(200).json({ valid: false });
                return;
            }
            res.status(200).json(await userPayload(account, db, userId, { displayName }));
        } catch (err) {
            const error = err as Error;
            console.error('[kittyfamily-auth] info', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/follow', async (req: Request, res: Response) => {
        const { token, profile } = req.body;
        try {
            const decoded = jwt.verify(token, secret()) as { userId: string };
            const { userId } = decoded;
            const account = await Models.Account.findOne({ address: userId.toLowerCase() });
            if (!account) {
                res.status(200).json({ valid: false });
                return;
            }
            const target = profile.toLowerCase();
            const self = userId.toLowerCase();
            const isFollowing = account.following && account.following.includes(target);
            if (isFollowing) {
                await Models.Account.updateOne({ address: self }, { $pull: { following: target } });
                await Models.Account.updateOne({ address: target }, { $pull: { followers: self } });
            } else {
                await Models.Account.updateOne({ address: self }, { $addToSet: { following: target } });
                await Models.Account.updateOne(
                    { address: target },
                    { $addToSet: { followers: self }, $setOnInsert: { address: target } },
                    { upsert: true },
                );
            }
            const updated = await Models.Account.findOne({ address: self });
            res.status(200).json(await userPayload(updated, db, userId));
        } catch (err) {
            const error = err as Error;
            console.error('[kittyfamily-auth] follow', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

export default routes;
