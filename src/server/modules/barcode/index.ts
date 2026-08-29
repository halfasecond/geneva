import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import { decode } from 'js-base64';
import Routes from './routes';
import Contracts from './contracts';
import { handleStandardERC721Event } from '../utils';
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
    Account: Model<any>;
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    [key: string]: Model<any>;
}

const processEvent = async (event: any, web3: any): Promise<void> => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr)
    const info = await contract.methods.tokenURI(event.tokenId).call().catch(e => console.log(e))
    const { attributes, description, name, image }  = JSON.parse(decode(info.split(',')[1]))
    event.description = description
    event.image = image
    attributes.map(a => {
        if (a.trait_type === 'Tile X') {
            event.x = a.value
        }
        if (a.trait_type === 'Tile Y') {
            event.y = a.value
        } 
    })
    
};

const logEvent = async (event: any, Models: Models, web3: any) => 
    handleStandardERC721Event(event, processEvent, Models, web3);

const runModule = (config: ModuleConfig) => {
    const { app, web3, db, name, prefix, deployed = 0, increment = 1000, eventsToWatch = ['Transfer'], watchContract } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models);

    if (!Contracts.Core?.addr) {
        console.log(`${name || 'barcode'}: no contract address — API only`);
        return;
    }

    return followContracts({
        name: name || 'barcode',
        watchContract,
        contracts: [{ abi: Contracts.Core.abi, addr: Contracts.Core.addr, events: eventsToWatch }],
        handle: (event) => logEvent(event, Models, web3),
        backfill: { web3, Models, deployed, increment },
    });
};

export default runModule;
