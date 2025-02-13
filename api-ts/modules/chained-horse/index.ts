import { Express } from 'express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { decode } from 'js-base64';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
import Contracts from './contracts';
import Socket from './socket';
import { getContractHistory, handleStandardERC721Event } from '../utils';

interface ModuleConfig {
    app: Express;
    io: Server;
    web3: Web3;
    db: Connection;
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
}

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

interface Event {
    tokenId: number;
    svg?: string;
    background?: string;
    tail?: string;
    mane?: string;
    pattern?: string;
    headAccessory?: string;
    bodyAccessory?: string;
    utility?: string;
    maneColor?: string;
    patternColor?: string;
    hoofColor?: string;
    bodyColor?: string;
    [key: string]: any;
}

const processEvent = async (event: Event, web3: Web3): Promise<void> => {
    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr);
    
    try {
        const svg = await contract.methods.tokenSVG(event.tokenId).call();
        event.svg = svg?.toString();

        const info = await contract.methods.tokenURI(event.tokenId).call();
        if (info) {
            const parts = info.toString().split(',');
            if (parts.length > 1) {
                const { attributes } = JSON.parse(decode(parts[1]));

                const findAttribute = (type: string) => 
                    attributes.find((a: { trait_type: string; value: string }) => a.trait_type === type)?.value;

                if (findAttribute('background')) {
                    event.background = findAttribute('background');
                    event.tail = findAttribute('tail');
                    event.mane = findAttribute('mane');
                    event.pattern = findAttribute('pattern');
                    event.headAccessory = findAttribute('head accessory');
                    event.bodyAccessory = findAttribute('body accessory');
                    event.utility = findAttribute('utility');
                    event.maneColor = findAttribute('mane color');
                    event.patternColor = findAttribute('pattern color');
                    event.hoofColor = findAttribute('hoof color');
                    event.bodyColor = findAttribute('body color');
                }
            }
        }
    } catch (error) {
        console.error('Error processing event:', error);
    }
};

const logEvent = async (event: any, Models: Models, web3: Web3) => 
    handleStandardERC721Event(event, processEvent, Models, web3);

const runModule = (config: ModuleConfig) => {
    const { app, io, web3, db, name, prefix, deployed = 0, increment = 1000, eventsToWatch = ['Transfer'] } = config;
    const Models = _Models(prefix, db);

    Routes(app, name, Models);
    Socket(io, web3, name || '', Models);

    if (Object.keys(Contracts).length && 
        Contracts[Object.keys(Contracts)[0]].abi && 
        Contracts[Object.keys(Contracts)[0]].addr) {
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
