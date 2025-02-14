import type { Express as ExpressType } from 'express';
import type { Server as SocketServer } from 'socket.io';
import type { Connection } from 'mongoose';
import type { default as Web3Type } from 'web3';

export type AnyExpress = {
    use: Function;
    [key: string]: any;
};

export type AnySocketServer = {
    on: Function;
    emit: Function;
    [key: string]: any;
};

declare module '../../api-ts/modules/index.js' {
    export default function modules(
        app: AnyExpress,
        io: AnySocketServer,
        web3: Web3Type | any,
        db: Connection
    ): void;
}
