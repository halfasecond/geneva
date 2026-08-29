import { Express, Request, Response } from 'express';
import type { Connection } from 'mongoose';
import type { IndexerStore } from './store';
import { screenAddress, screeningResultToCsv } from './screening';

export function mountIndexerRoutes(app: Express, httpUrl: string, store: IndexerStore, db: Connection): void {
    const health = (_req: Request, res: Response) => {
        res.json({
            status: db.readyState === 1 ? 'ok' : 'degraded',
            mongo: db.readyState === 1,
        });
    };

    const stats = async (_req: Request, res: Response) => {
        res.json(await store.getStats());
    };

    const screen = async (req: Request, res: Response) => {
        const address = req.params.address;
        if (!address?.startsWith('0x') || address.length !== 42) {
            res.status(400).json({ error: 'Invalid Ethereum address' });
            return;
        }
        try {
            const result = await screenAddress(address, httpUrl, store);
            if (req.query.format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${address}.csv"`);
                res.send(screeningResultToCsv(result));
                return;
            }
            res.json(result);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[api] screen failed:', msg);
            res.status(500).json({ error: msg });
        }
    };

    app.get('/health', health);
    app.get('/api/health', health);
    app.get('/stats', stats);
    app.get('/api/stats', stats);
    app.get('/screen/:address', screen);
    app.get('/api/screen/:address', screen);
}
