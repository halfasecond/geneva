import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { newsQueries } from './queries';
import { KittyNewsModels } from './models';
import { Connection } from 'mongoose';
import auth from './auth';

const secret = () => process.env.JWT_SECRET || 'default-secret';

const isAdmin = (address: string) => {
    const raw = process.env.VITE_APP_KN_ADMIN || process.env.KN_ADMIN || process.env.VITE_APP_ADMIN || process.env.KF_ADMIN || '';
    return raw.toLowerCase().includes(address.toLowerCase());
};

const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization header is missing or not in the correct format' });
        return;
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secret(), (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        const userId = (decoded as { userId: string }).userId;
        if (!isAdmin(userId)) {
            res.status(403).json({ error: 'Forbidden: You do not have the required permissions' });
            return;
        }
        next();
    });
};

export default (app: Express, Models: KittyNewsModels, db: Connection) => {
    const q = newsQueries(Models, db);
    app.use('/kittynews/auth', auth(Models));

    app.get('/kittynews/cms', async (req, res) => {
        try {
            const type = typeof req.query.type === 'string' ? req.query.type : undefined;
            res.json(await q.cmsList(type));
        } catch (error) {
            console.error('[kittynews] cms', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/cms/:slug', async (req, res) => {
        try {
            const copy = await q.cmsBySlug(req.params.slug);
            if (!copy) {
                res.status(404).json({ error: 'Copy not found' });
                return;
            }
            res.json(copy);
        } catch (error) {
            console.error('[kittynews] cms slug', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/dailies', async (_req, res) => {
        try {
            res.json(await q.dailies());
        } catch (error) {
            console.error('[kittynews] dailies', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/ethprices', async (_req, res) => {
        try {
            res.json(await q.ethprices());
        } catch (error) {
            console.error('[kittynews] ethprices', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/auctions', async (_req, res) => {
        try {
            res.json(await q.auctions());
        } catch (error) {
            console.error('[kittynews] auctions', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/auctionsuccess', async (_req, res) => {
        try {
            res.json(await q.auctionsuccess());
        } catch (error) {
            console.error('[kittynews] auctionsuccess', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/kittynews/transfers', async (_req, res) => {
        try {
            res.json(await q.transfers());
        } catch (error) {
            console.error('[kittynews] transfers', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/kittynews/cms', authenticateAdmin, async (req: Request, res: Response) => {
        const { slug, title, author, publishedDate, contentType, thumbnail, content, tags, published } = req.body;
        if (!slug || !title || !author || !contentType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        try {
            const parsedPublishedDate = publishedDate ? new Date(String(publishedDate).replace('000Z', '00Z')) : new Date();
            const saved = await Models.Cms.create({
                slug,
                title,
                author,
                publishedDate: parsedPublishedDate,
                contentType,
                thumbnail: thumbnail || { src: '', alt: '' },
                content: content || [],
                tags: tags || [],
                published: published || false,
            });
            res.status(201).json(saved);
        } catch (error) {
            const err = error as Error;
            console.error('[kittynews] cms create', err);
            res.status(400).json({ error: err.message });
        }
    });

    app.put('/kittynews/cms/:id', authenticateAdmin, async (req: Request, res: Response) => {
        try {
            const copy = await Models.Cms.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!copy) {
                res.status(404).json({ error: 'Copy not found' });
                return;
            }
            res.status(200).json(copy);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    });

    app.delete('/kittynews/cms/:id', authenticateAdmin, async (req: Request, res: Response) => {
        try {
            const copy = await Models.Cms.findByIdAndDelete(req.params.id);
            if (!copy) {
                res.status(404).json({ error: 'Copy not found' });
                return;
            }
            res.status(200).json({ message: 'Copy deleted successfully' });
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ error: err.message });
        }
    });
};
