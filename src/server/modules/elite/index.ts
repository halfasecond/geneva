import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
import Contracts from './contracts';
import { handleStandardERC721Event } from '../utils';
import { fetchVechTokenMetadata } from './metadata';
import { followContracts, type WatchContractFn } from '../../indexer';

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
    watchContract?: WatchContractFn;
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

export const logEvent = async (event: any, Models: Models, web3: any) =>
    handleStandardERC721Event(event, processEvent, Models, web3);

const runModule = (config: ModuleConfig) => {
    const { app, web3, db, name, prefix, deployed = 14035510, increment = 10000, eventsToWatch = ['Transfer'], watchContract } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models, web3);

    return followContracts({
        name: name || 'vech',
        watchContract,
        contracts: [{ abi: Contracts.Core.abi, addr: Contracts.Core.addr, events: eventsToWatch }],
        handle: (event) => logEvent(event, Models, web3),
        backfill: { web3, Models, deployed, increment },
    });
};

export default runModule;