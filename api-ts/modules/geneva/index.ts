import { Express } from 'express';
import { Server } from 'socket.io';
import { Model, Connection } from 'mongoose';
import _Models from './models';
import Routes from './routes';
// import Socket from './socket';

interface ModuleConfig {
    app: Express;
    io: Server;
    web3: any;
    db: Connection;
    name?: string;
    prefix?: string;
    deployed?: number;
    increment?: number;
    eventsToWatch?: string[];
}

interface Models {
    Account: Model<any>;
    CMS: Model<any>;
    [key: string]: Model<any>;
}

const runModule = (config: ModuleConfig) => {
    const { app, db, name, prefix } = config;
    const Models = _Models(prefix, db);
    Routes(app, name, Models);
    // Socket(io, web3, name ? name : '', Models);
};

export default runModule;
