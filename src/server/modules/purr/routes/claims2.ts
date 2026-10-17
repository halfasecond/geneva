import express, { Router } from 'express';
import { GILDED_COUNT, GILDED_ROOT, gildedProof } from '../gilded';

const routes = (): Router => {
    const router = express.Router();

    router.get('/', (_req, res) => {
        res.json({ root: GILDED_ROOT, count: GILDED_COUNT });
    });

    router.get('/:tokenId', (req, res) => {
        const raw = req.params.tokenId;
        if (!/^(0|[1-9]\d*)$/.test(raw)) {
            return res.status(400).json({ error: 'Invalid token id' });
        }
        const tokenId = Number(raw);
        const proof = gildedProof(tokenId);
        if (!proof) {
            return res.json({ tokenId, eligible: false, isGilded: false });
        }
        return res.json({
            tokenId,
            eligible: true,
            isGilded: true,
            proof,
        });
    });

    return router;
};

export default routes;
