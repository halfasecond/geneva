import { Express } from 'express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { Model } from 'mongoose';
import _Models from './models';
import Routes from './routes';
// import Contracts from './contracts';
// import Socket from './socket';
// import { getContractHistory, handleStandardERC721Event } from '../utils';

interface ModuleConfig {
    name?: string;
    prefix: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
}

interface Models {
    Account: Model<any>;
    CMS: Model<any>;
    [key: string]: Model<any>;
}

interface Event {
    event: string;
    blockNumber: number;
    transactionHash: string;
    returnValues: {
        tokenId?: number;
        from?: string;
        to?: string;
        [key: string]: any;
    };
}

const processEvent = undefined;

const logEvent = async (event: Event, Models: Models, web3: Web3) => 
    // handleStandardERC721Event(event, processEvent, Models, web3);
    undefined;

const runModule = (app: Express, io: Server, web3: Web3, config: ModuleConfig) => {
    const { name, prefix, deployed, increment, eventsToWatch } = config;
    const Models = {} as Models;

    Object.keys(_Models).map((m, i) => {
        Models[m as keyof Models] = _Models[m](prefix);
        if (i === Object.keys(_Models).length - 1) {
            Routes(app, name, Models);
            // Socket(io, web3, name ? name : '', Models);
        }
    });

    // if (Object.keys(Contracts) && Contracts[Object.keys(Contracts)[0]].abi && Contracts[Object.keys(Contracts)[0]].addr) {
    //     const module = { 
    //         Contracts, 
    //         Models, 
    //         deployed, 
    //         increment, 
    //         eventsToWatch, 
    //         logEvent: (event: Event) => logEvent(event, Models, web3) 
    //     };
    //     getContractHistory(name === undefined ? 'default module' : name, module, eventsToWatch, web3);
    // } else {
    //     console.log('no contract found to observe');
    // }
};

export default runModule;
