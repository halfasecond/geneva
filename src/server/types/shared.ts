import { Express } from 'express';
import { Server } from 'socket.io';
import { Connection, Model } from 'mongoose';

export interface ModuleConfig {
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

export interface Models {
    Account: Model<any>;
    CMS: Model<any>;
    [key: string]: Model<any>;
}

export type ModuleFunction = (
    app: Express,
    io: Server,
    web3: any,
    db: Connection
) => void;
