import EventEmitter from 'events';
import type { Express } from 'express';
import type { Connection } from 'mongoose';
import { resolveRpcUrl } from './rpc-url';
import { IndexerStore } from './store';
import { ContractRegistry } from './registry';
import { BlockFollower } from './follower';
import { mountIndexerRoutes } from './routes';

export type { WatchedContract } from './registry';
export { ContractRegistry } from './registry';
export { followContracts, type FollowedContract, type WatchContractFn } from './follow';
export { parseRpcUrl, resolveRpcUrl } from './rpc-url';
export { erc20BalanceOf } from './rpc';

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

    mountIndexerRoutes(app, httpUrl, store, db);

    return {
        registry,
        store,
        httpUrl,
        wssUrl,
        start: () => follower.start(),
        stop: () => follower.stop(),
    };
}
