import { ModuleFunction } from '../types/shared';
import EventEmitter from 'events';
import { createIndexer, isFollowEnabled, type WatchContractFn } from '../indexer';
import defaultModule from './geneva';
import chainedHorseModule from './chained-horse';
import chainfacesModule from './chainfaces'
import twobitbearsModule from './twobitbears'
import purrModule from './purr'
import aquariumModule from './aquarium'
import eliteModule from './elite'
import cryptokittiesModule from './cryptokitties'
import kittyNewsModule from './kittynews'
import kittyFamilyModule from './kittyfamily'
import kittyHatsModule from './kitty-hats'
import kittyInternationalModule from './kittyinternational'
import eggModule from './egg'
import hasModule from './has'
import flowbotsModule from './flowbots'
import barcodeModule from './barcode'

let stopIndexer: (() => void) | null = null;
let watchersReady: Promise<void> = Promise.resolve();

export function stopBlockIndexer(): void {
    stopIndexer?.();
    stopIndexer = null;
}

export function whenWatchersReady(): Promise<void> {
    return watchersReady;
}

const modules: ModuleFunction = (app, io, web3, db) => {
    class Emitter extends EventEmitter {}
    const emitter = new Emitter()

    const indexer = createIndexer(app, db, web3, emitter)
    stopIndexer = indexer.stop
    const follow = isFollowEnabled()
    const watchContract: WatchContractFn | undefined = follow
        ? (contract) => indexer.registry.watch(contract)
        : undefined

    const shared = { app, io, web3, db, emitter, watchContract }

    defaultModule({
        ...shared,
        name: '',
        prefix: '',
    });

    aquariumModule({ ...shared, name: 'aquarium', prefix: 'aq', deployed: 0, increment: 10000, eventsToWatch: [] })

    // Kitty read APIs + sockets. Same mongo dumps as elliptic; no extra RPC.
    kittyNewsModule({ ...shared, name: 'kittynews' })
    kittyFamilyModule({ ...shared, name: 'kittyfamily' })
    kittyHatsModule({ app, db })
    kittyInternationalModule({ app, db })
    eggModule({ app, db })
    hasModule({ app, db })

    // Local/hardhat projects: routes only. Do not watch on the mainnet follower.
    flowbotsModule({ app, io, web3, db, emitter, name: 'flowbots', prefix: 'fbot', deployed: 0, increment: 100, eventsToWatch: ['Transfer'] })
    barcodeModule({ app, io, web3, db, emitter, name: 'barcode', prefix: 'bc', deployed: 0, increment: 1000, eventsToWatch: ['Transfer'] })

    watchersReady = (async () => {
        // Mount project APIs. Watches + WSS only if INDEXER_FOLLOW=true.
        // When follow is on, sequential catch-up stays within the 2-connection QuickNode cap.
        await chainedHorseModule({
            ...shared,
            name: 'chained-horse',
            prefix: 'ch',
            deployed: 13504887,
            increment: 10000,
            eventsToWatch: ['Transfer'],
        })
        await chainfacesModule({
            ...shared,
            name: 'chainfaces',
            prefix: 'cf',
            deployed: 9314784,
            increment: 2500,
            eventsToWatch: ['Transfer'],
        })
        await twobitbearsModule({
            ...shared,
            name: 'twobitbears',
            prefix: 'tbb',
            deployed: 13385399,
            increment: 1000,
            eventsToWatch: ['Transfer'],
        })
        await purrModule({
            ...shared,
            name: 'purr',
            prefix: 'purr',
            deployed: 22755367,
            increment: 1000,
            eventsToWatch: ['Transfer'],
        })
        await eliteModule({
            ...shared,
            name: 'vech',
            prefix: 'vech',
            deployed: 14035510,
            increment: 10000,
            eventsToWatch: ['Transfer'],
        })
        await cryptokittiesModule({
            ...shared,
            name: 'cryptokitties',
            prefix: 'ck',
            deployed: 4605346,
            increment: 10000,
            eventsToWatch: ['Transfer', 'Birth', 'Pregnant'],
        })

        await indexer.start()
    })();
    watchersReady.catch((error) => {
        console.error('[indexer] failed to start:', error);
    })
};

export default modules;
