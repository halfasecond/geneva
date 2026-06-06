import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import { decode } from 'js-base64';
import Routes from './routes';
import Contracts from './contracts';
import { getContractHistory, handleStandardERC721Event } from '../utils';

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
    const { app, io, web3, db, name, prefix, deployed = 0, increment = 1000, eventsToWatch = ['Transfer'], emitter } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models);
    if (Object.keys(Contracts).length) {
        const module = { 
            Contracts, 
            Models, 
            deployed, 
            increment, 
            eventsToWatch, 
            logEvent: (event: any) => logEvent(event, Models, web3) 
        };
        getContractHistory(name || 'default module', module, eventsToWatch, web3);
    } else {
        console.log('no contract found to observe');
    }
};

export default runModule;
