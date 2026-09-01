import express, { Router } from 'express';
import { ensureCattributes } from '../cattributesCatalog';

const routes = (): Router => {
    const router = express.Router();

    router.get('/', async (_req, res) => {
        try {
            const cattributes = await ensureCattributes();
            res.status(200).send(cattributes);
        } catch (error) {
            console.error('[cattributes] catalog', error);
            res.status(502).send({ error: 'cattributes catalog unavailable' });
        }
    });

    return router;
};

export default routes;