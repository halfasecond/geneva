import type { Express } from 'express';
import type { Server } from 'socket.io';
import type { Connection } from 'mongoose';
import type Web3 from 'web3';

// Module system types
export interface ModuleConfig {
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

// Web3 connection
declare module '../config/web3.js' {
    export function createWeb3Connection(socketUrl: string): Web3;
}

// Module system
declare module '../modules/index.js' {
    export function modules(
        app: any,
        io: any,
        web3: any,
        db: Connection
    ): void;
}
