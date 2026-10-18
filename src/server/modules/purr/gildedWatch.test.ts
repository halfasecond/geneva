import { describe, expect, it } from 'vitest'
import { GILDED_CLAIM } from './claimEvents'
import { isLogRangeError, redactRpc, scanLogWindows, storeGildedClaim } from './gildedWatch'

describe('scanLogWindows', () => {
    it('walks a range and counts saved logs', async () => {
        const seen: number[] = []
        const next = await scanLogWindows({
            fromBlock: 10,
            head: 25,
            window: 10,
            fetchWindow: async (from, to) => {
                seen.push(from, to)
                return from === 10 ? [{ blockNumber: 12, logIndex: 1 }] : []
            },
            handle: async () => true,
        })
        expect(seen).toEqual([10, 19, 20, 25])
        expect(next).toEqual({ fromBlock: 26, found: 1 })
    })

    it('shrinks the window when the RPC rejects the block range', async () => {
        const widths: number[] = []
        const next = await scanLogWindows({
            fromBlock: 0,
            head: 9,
            window: 10,
            fetchWindow: async (from, to) => {
                widths.push(to - from + 1)
                if (to - from + 1 > 5) {
                    throw new Error('You can make eth_getLogs requests with up to a 100 block range')
                }
                return []
            },
            handle: async () => true,
        })
        expect(widths[0]).toBe(10)
        expect(widths).toContain(5)
        expect(next.fromBlock).toBe(10)
        expect(next.found).toBe(0)
    })

    it('leaves the cursor in place when a log fails to save', async () => {
        await expect(scanLogWindows({
            fromBlock: 5,
            head: 5,
            window: 1,
            fetchWindow: async () => [{ blockNumber: 5, logIndex: 0 }],
            handle: async () => { throw new Error('mongo down') },
        })).rejects.toThrow('mongo down')
    })

    it('does not treat an RPC outage as a range limit', () => {
        expect(isLogRangeError(new Error('request to https://rpc.example/secret failed'))).toBe(false)
        expect(redactRpc(new Error('request to https://rpc.example/secret failed'))).toBe('request to [rpc] failed')
    })
})

describe('storeGildedClaim', () => {
    const memory = () => {
        const claims: any[] = []
        const events: any[] = []
        class ClaimDoc {
            doc: any
            constructor(doc: any) { this.doc = doc }
            async save() {
                if (claims.some((row) => row.tokenId === this.doc.tokenId)) {
                    const error: any = new Error('dup')
                    error.code = 11000
                    throw error
                }
                claims.push(this.doc)
            }
        }
        class EventDoc {
            doc: any
            constructor(doc: any) { this.doc = doc }
            async save() { events.push(this.doc) }
        }
        return {
            claims,
            events,
            Models: {
                GildedClaim: Object.assign(ClaimDoc, {
                    findOne: async (query: { tokenId: number }) =>
                        claims.find((row) => row.tokenId === query.tokenId) || null,
                }),
                Event: EventDoc,
            },
        }
    }

    const gilded = {
        event: GILDED_CLAIM,
        address: '0x04ab1ffc02083acbd528ad782d564e2b19680edf',
        transactionHash: '0xabc',
        blockNumber: 26214840,
        returnValues: {
            claimer: '0xABC',
            kittyId: 3012n,
            amount: 100000000000000000000n,
        },
    }

    it('saves a gilded claim once per kitty', async () => {
        const { claims, events, Models } = memory()
        expect(await storeGildedClaim(gilded, Models)).toBe(true)
        expect(await storeGildedClaim(gilded, Models)).toBe(false)
        expect(claims).toHaveLength(1)
        expect(claims[0]).toMatchObject({ tokenId: 3012, address: '0xabc', blockNumber: 26214840 })
        expect(events).toHaveLength(1)
        expect(events[0].event).toBe(GILDED_CLAIM)
    })

    it('ignores grandmaster claims', async () => {
        const { claims, Models } = memory()
        expect(await storeGildedClaim({ ...gilded, event: 'GrandmasterClaim' }, Models)).toBe(false)
        expect(claims).toHaveLength(0)
    })
})
