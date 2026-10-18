import Contracts from './contracts'
import {
    GILDED_CLAIM,
    PURR_CLAIM2,
    PURR_CLAIM2_DEPLOYED,
    kittyClaimFields,
} from './claimEvents'
import { isFollowEnabled } from '../../indexer/flags'

const POLL_MS = 60_000

export const errorText = (error: unknown): string => {
    const parts: string[] = []
    const push = (value: unknown) => {
        if (value instanceof Error) parts.push(value.message)
        else if (typeof value === 'string') parts.push(value)
        else if (value && typeof value === 'object' && 'message' in value) {
            parts.push(String((value as { message: unknown }).message))
        }
    }
    push(error)
    if (error && typeof error === 'object' && 'cause' in error) {
        push((error as { cause: unknown }).cause)
    }
    return parts.join(' ') || String(error)
}

export const redactRpc = (error: unknown): string =>
    errorText(error).replace(/https?:\/\/\S+/g, '[rpc]')

export const isLogRangeError = (error: unknown): boolean =>
    /block range|blocks are not supported|limited to a \d+ range|eth_getLogs is limited|too many|query returned more/i.test(errorText(error))

/** Alchemy on prod allows 100-block eth_getLogs. GETLOGS_MAX_RANGE can lower that. */
export const gildedLogWindow = (): number => {
    const configured = process.env.GETLOGS_MAX_RANGE
    const cap = configured == null || configured === '' ? 100 : Number(configured)
    const size = Number.isFinite(cap) ? cap : 100
    return Math.min(100, Math.max(1, size))
}

const isDuplicate = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000

export async function storeGildedClaim(event: {
    event?: string
    address?: string
    transactionHash?: string
    blockNumber?: number | string | bigint
    returnValues?: Record<string, unknown>
}, Models: { Event: any; GildedClaim: any }): Promise<boolean> {
    if (event.event !== GILDED_CLAIM) return false
    const fields = kittyClaimFields(event)
    if (!fields) throw new Error('GildedClaim missing claimer, kittyId, or amount')

    const existing = await Models.GildedClaim.findOne({ tokenId: fields.tokenId })
    if (existing) return false

    const blockNumber = Number(event.blockNumber)
    try {
        await new Models.GildedClaim({
            tokenId: fields.tokenId,
            address: fields.address,
            amount: fields.amount,
            transactionHash: event.transactionHash,
            blockNumber: Number.isFinite(blockNumber) ? blockNumber : undefined,
            timestamp: new Date(),
        }).save()
    } catch (error) {
        if (isDuplicate(error)) return false
        throw error
    }

    try {
        await new Models.Event({
            contract: String(event.address || PURR_CLAIM2).toLowerCase(),
            event: GILDED_CLAIM,
            transactionHash: event.transactionHash,
            blockNumber: Number.isFinite(blockNumber) ? blockNumber : undefined,
            from: PURR_CLAIM2,
            to: fields.address,
            amount: fields.amount,
            timestamp: new Date(),
        }).save()
    } catch (error) {
        console.error('purr: saved gilded claim but not the event log', redactRpc(error))
    }
    return true
}

export async function scanLogWindows(opts: {
    fromBlock: number
    head: number
    window: number
    fetchWindow: (fromBlock: number, toBlock: number) => Promise<any[]>
    handle: (event: any) => Promise<boolean>
}): Promise<{ fromBlock: number; found: number }> {
    let from = opts.fromBlock
    let size = Math.max(1, opts.window)
    const cap = size
    let found = 0
    while (from <= opts.head) {
        const to = Math.min(from + size - 1, opts.head)
        let events: any[]
        try {
            events = await opts.fetchWindow(from, to)
        } catch (error) {
            if (size > 1 && isLogRangeError(error)) {
                size = Math.max(1, Math.floor(size / 2))
                continue
            }
            throw error
        }
        events.sort((a, b) => {
            const block = Number(a.blockNumber) - Number(b.blockNumber)
            if (block !== 0) return block
            return Number(a.logIndex) - Number(b.logIndex)
        })
        for (const event of events) {
            if (await opts.handle(event)) found += 1
        }
        from = to + 1
        size = cap
    }
    return { fromBlock: from, found }
}

const fetchGildedLogs = async (web3: any, fromBlock: number, toBlock: number) => {
    const contract = new web3.eth.Contract(Contracts.PurrClaim2.abi, PURR_CLAIM2)
    const logs = await contract.getPastEvents(GILDED_CLAIM, { fromBlock, toBlock })
    return (logs || []).map((event: any) => ({ ...event, event: event.event || GILDED_CLAIM }))
}

/**
 * Pull GildedClaim logs into purr_gildedclaims.
 * One pass at startup. While INDEXER_FOLLOW is off, poll every minute.
 * Follow mode stays off: it would also start the CryptoKitties watcher.
 */
export function startGildedClaimPoll(opts: {
    web3: any
    Models: { Event: any; GildedClaim: any }
}): void {
    let fromBlock: number | null = null
    let pulling = false
    let announced = false

    const tick = async () => {
        if (pulling) return
        pulling = true
        const start = fromBlock
        try {
            if (fromBlock == null) {
                const latest = await opts.Models.GildedClaim.findOne(
                    { blockNumber: { $type: 'number' } },
                    {},
                    { sort: { blockNumber: -1 } },
                )
                fromBlock = latest ? Number(latest.blockNumber) : PURR_CLAIM2_DEPLOYED
            }
            const head = Number(await opts.web3.eth.getBlockNumber())
            const cursor = fromBlock
            const next = await scanLogWindows({
                fromBlock: cursor,
                head,
                window: gildedLogWindow(),
                fetchWindow: (from, to) => fetchGildedLogs(opts.web3, from, to),
                handle: (event) => storeGildedClaim(event, opts.Models),
            })
            fromBlock = next.fromBlock
            if (!announced || next.found > 0) {
                console.log(`purr: GildedClaim ${cursor}..${head} (${next.found} new)`)
                announced = true
            }
        } catch (error) {
            fromBlock = start
            console.error('purr: GildedClaim pull failed', redactRpc(error))
        } finally {
            pulling = false
        }
    }

    void tick()
    if (!isFollowEnabled()) {
        const timer = setInterval(() => { void tick() }, POLL_MS)
        timer.unref?.()
    }
}
