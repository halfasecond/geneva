import { createServer } from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { describe, expect, it } from 'vitest';
import { GILDED_COUNT, GILDED_ROOT, gildedProof, verifyGildedProof } from './gilded';
import claims2 from './routes/claims2';

describe('gilded merkle tree', () => {
    it('publishes the claim-2 root for 2177 gilded kitties', () => {
        expect(GILDED_COUNT).toBe(2177);
        expect(GILDED_ROOT).toBe('0x95f90afe1c8941379e7936dd7f21808ba117bd97c48c9384c838e3e1b9e59191');
    });

    it('returns a proof that verifies for a gilded kitty', () => {
        const proof = gildedProof(3012);
        expect(proof).toHaveLength(12);
        expect(verifyGildedProof(3012, proof!)).toBe(true);
    });

    it('has no proof for a kitty outside the tree', () => {
        expect(gildedProof(1)).toBeUndefined();
        expect(verifyGildedProof(1, gildedProof(3012)!)).toBe(false);
    });
});

describe('GET /purr/claims2', () => {
    const withServer = async (run: (base: string) => Promise<void>) => {
        const app = express();
        app.use('/purr/claims2', claims2());
        const server = createServer(app);
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
        const { port } = server.address() as AddressInfo;
        try {
            await run(`http://127.0.0.1:${port}`);
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            });
        }
    };

    it('returns the root and a proof for a gilded kitty', async () => {
        await withServer(async (base) => {
            const root = await fetch(`${base}/purr/claims2`).then((res) => res.json());
            expect(root).toEqual({ root: GILDED_ROOT, count: 2177 });

            const res = await fetch(`${base}/purr/claims2/3012`);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body.tokenId).toBe(3012);
            expect(body.eligible).toBe(true);
            expect(body.isGilded).toBe(true);
            expect(body.proof).toEqual(gildedProof(3012));
        });
    });

    it('returns ineligible for other kitties and 400 for a bad id', async () => {
        await withServer(async (base) => {
            const miss = await fetch(`${base}/purr/claims2/1`).then((res) => res.json());
            expect(miss).toEqual({ tokenId: 1, eligible: false, isGilded: false });

            const bad = await fetch(`${base}/purr/claims2/nope`);
            expect(bad.status).toBe(400);
            expect(await bad.json()).toEqual({ error: 'Invalid token id' });
        });
    });
});
