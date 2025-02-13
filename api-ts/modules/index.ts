import { Express } from '../types/express';
import { Server } from 'socket.io';
import Web3 from 'web3';
import { Connection } from 'mongoose';
import defaultModule from './geneva';
import chainedHorseModule from './chained-horse';

const modules = (app: Express, io: Server, web3: Web3, db: Connection) => {
    // Initialize default (geneva) module
    defaultModule({
        app,
        io,
        web3,
        db,
        name: '',  // no name prefix for default module endpoints
        prefix: ''  // no prefix for db tables
    });

    // Initialize chained-horse module
    chainedHorseModule({
        app,
        io,
        web3,
        db,
        name: 'chained-horse',  // adds name to server project endpoint
        prefix: 'ch',          // changed from 'horse' to 'ch' for db tables
        deployed: 13504887,      // block the contract was deployed
        increment: 10000,        // bumped from 100 to 1000 for low-activity contract
        eventsToWatch: ['Transfer']  // events to monitor
    });
};

export default modules;
