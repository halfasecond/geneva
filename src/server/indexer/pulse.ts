import type EventEmitter from 'events';
import { fetchBlock, getLatestBlockNumber, hexToNumber } from './rpc';

const POLL_MS = 12_000;

/**
 * Header-only pulse: HTTP eth_blockNumber + getBlockByNumber (no txs, no WSS, no watches).
 * Emits newEthBlock so dailies close on chain time, not wall-clock UTC.
 */
const hostOf = (url: string) => {
    try {
        return new URL(url).host;
    } catch {
        return 'rpc';
    }
};

export function startBlockPulse(httpUrl: string, emitter: EventEmitter): () => void {
    let closed = false;
    let last = 0;
    let timer: NodeJS.Timeout | null = null;
    const fallback = (process.env.BLOCK_RPC_FALLBACK || '').trim();
    const urls = fallback && fallback !== httpUrl ? [httpUrl, fallback] : [httpUrl];

    const readHead = async (url: string) => {
        const latest = await getLatestBlockNumber(url);
        const block = await fetchBlock(url, latest, false);
        return { latest, timestamp: hexToNumber(block.timestamp), url };
    };

    const tick = async () => {
        let lastErr = '';
        for (const url of urls) {
            try {
                const head = await readHead(url);
                if (head.latest === last) return;
                last = head.latest;
                emitter.emit('newEthBlock', { number: head.latest, timestamp: head.timestamp });
                return;
            } catch (error) {
                lastErr = error instanceof Error ? error.message : String(error);
                console.error(`[indexer] pulse ${hostOf(url)}`, lastErr);
            }
        }
    };

    const loop = () => {
        if (closed) return;
        void tick().finally(() => {
            if (!closed) timer = setTimeout(loop, POLL_MS);
        });
    };

    console.log('[indexer] HTTP block pulse (no WSS, no contract watches)');
    void loop();
    return () => {
        closed = true;
        if (timer) clearTimeout(timer);
    };
}
