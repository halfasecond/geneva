import type EventEmitter from 'events';
import { fetchBlock, getLatestBlockNumber, hexToNumber } from './rpc';

const POLL_MS = 12_000;

/**
 * Header-only pulse: HTTP eth_blockNumber + getBlockByNumber (no txs, no WSS, no watches).
 * Emits newEthBlock so dailies close on chain time, not wall-clock UTC.
 */
export function startBlockPulse(httpUrl: string, emitter: EventEmitter): () => void {
    let closed = false;
    let last = 0;
    let timer: NodeJS.Timeout | null = null;

    const tick = async () => {
        try {
            const latest = await getLatestBlockNumber(httpUrl);
            if (latest === last) return;
            const block = await fetchBlock(httpUrl, latest, false);
            last = latest;
            const timestamp = hexToNumber(block.timestamp);
            emitter.emit('newEthBlock', { number: latest, timestamp });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('[indexer] pulse', msg);
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
