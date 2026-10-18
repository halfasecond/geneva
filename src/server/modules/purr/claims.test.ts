import { createServer } from 'http'
import type { AddressInfo } from 'net'
import express from 'express'
import { describe, expect, it } from 'vitest'
import claims from './routes/claims'

const collection = (rows: any[]) => ({
    find: async () => rows.map((row) => ({ ...row })),
    findOne: async (query: { tokenId: number }) => rows.find((row) => row.tokenId === query.tokenId) || null,
})

const withServer = async (Models: any, run: (base: string) => Promise<void>) => {
    const app = express()
    app.use('/purr/claims', claims(Models))
    const server = createServer(app)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const { port } = server.address() as AddressInfo
    try {
        await run(`http://127.0.0.1:${port}`)
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()))
        })
    }
}

describe('GET /purr/claims', () => {
    const Models = {
        Claim: collection([
            { tokenId: 10, address: '0xday1', amount: '1', timestamp: '2026-01-01T00:00:00.000Z' },
        ]),
        GildedClaim: collection([
            { tokenId: 3012, address: '0xgilded', amount: '100', blockNumber: 26214840, timestamp: '2026-10-18T00:00:00.000Z' },
        ]),
    }

    it('returns claim 1 and gilded claims oldest first', async () => {
        await withServer(Models, async (base) => {
            const body = await fetch(`${base}/purr/claims`).then((res) => res.json())
            expect(body.map((row: { tokenId: number }) => row.tokenId)).toEqual([10, 3012])
        })
    })

    it('keeps the claim-1 lookup off the gilded collection', async () => {
        await withServer(Models, async (base) => {
            const body = await fetch(`${base}/purr/claims/3012`).then((res) => res.json())
            expect(body.claimed).not.toBe(true)
            expect(body.address).toBeUndefined()
        })
    })
})
