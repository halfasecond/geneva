import EventEmitter from 'events';
import type { Express } from 'express';
import type { Connection } from 'mongoose';
import { resolveHeadRpc, resolveRpcUrl } from './rpc-url';
import { IndexerStore } from './store';
import { ContractRegistry } from './registry';
import { BlockFollower } from './follower';
import { isFollowEnabled } from './flags';
import { mountIndexerRoutes } from './routes';
import { startBlockPulse } from './pulse';

export type { WatchedContract } from './registry';
export { ContractRegistry } from './registry';
export { followContracts, type FollowedContract, type WatchContractFn } from './follow';
export { isCatchupEnabled, isFollowEnabled } from './flags';
export { parseRpcUrl, resolveHeadRpc, resolveRpcUrl } from './rpc-url';
export { erc20BalanceOf, getLatestBlockNumber } from './rpc';

export interface IndexerHandle {
    registry: ContractRegistry;
    store: IndexerStore;
    httpUrl: string;
    wssUrl: string | null;
    start: () => Promise<void>;
    stop: () => void;
}

export function createIndexer(app: Express, db: Connection, web3: any, emitter: EventEmitter): IndexerHandle {
    const { http: httpUrl, wss: wssUrl } = resolveRpcUrl();
    const store = new IndexerStore(db);
    const registry = new ContractRegistry();
    const follower = new BlockFollower({ httpUrl, wssUrl, web3, store, registry, emitter });
    let stopPulse: (() => void) | null = null;

    mountIndexerRoutes(app, httpUrl, store, db, registry);

    return {
        registry,
        store,
        httpUrl,
        wssUrl,
        start: async () => {
            if (!isFollowEnabled()) {
                const head = resolveHeadRpc();
                console.log(`[indexer] follow off — block pulse via ${new URL(head).host}`);
                stopPulse = startBlockPulse(head, emitter);
                return;
            }
            if (registry.list().length === 0) {
                console.log('[indexer] no contracts registered — not starting follower');
                return;
            }
            await follower.start();
        },
        stop: () => {
            stopPulse?.();
            stopPulse = null;
            follower.stop();
        },
    };
}
