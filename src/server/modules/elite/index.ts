import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
import Contracts from './contracts';
import { getContractHistory, handleStandardERC721Event } from '../utils';
import { fetchVechTokenMetadata } from './metadata';
import { reindexVechMetadata } from './reindex';

interface ModuleConfig {
    app: Express;
    io: Server;
    web3: any;
    db: Connection;
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
    emitter: any;
}

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const processEvent = async (event: any, web3: any): Promise<void> => {
    const patch = await fetchVechTokenMetadata(web3, event.tokenId);
    if (patch) {
        Object.assign(event, patch);
        const ship = patch.shipId !== undefined ? ` ship #${patch.shipId}` : '';
        console.log(`vech token #${event.tokenId}${ship}: ${patch.animation_url || patch.name || 'stored'}`);
    } else {
        console.warn(`vech token #${event.tokenId} metadata: not resolved during mint indexing`);
    }
};

const logEvent = async (event: any, Models: Models, web3: any) =>
    handleStandardERC721Event(event, processEvent, Models, web3);

const runIndexer = async (config: ModuleConfig, Models: Models) => {
    const { web3, name, deployed = 0, increment = 1000, eventsToWatch = ['Transfer'] } = config;
    const { VITE_ENABLE_INDEXER } = process.env;

    if (!Object.keys(Contracts).length) {
        console.log('no contract found to observe');
        return;
    }

    const module = {
        Contracts,
        Models,
        deployed,
        increment,
        eventsToWatch,
        logEvent: (event: any) => logEvent(event, Models, web3),
    };

    await getContractHistory(name || 'vech', module, eventsToWatch, web3);

    // Mint is over — after the one-time historical scan, always backfill any NFTs missing metadata.
    if (VITE_ENABLE_INDEXER === 'true') {
        console.log('vech: historical scan complete — running metadata pass');
        await reindexVechMetadata(Models, web3);
    }
};

const runModule = (config: ModuleConfig) => {
    const { app, web3, db, name, prefix } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models, web3);

    runIndexer(config, Models).catch((error) => {
        console.error('vech indexer failed:', error);
    });
};

export default runModule;