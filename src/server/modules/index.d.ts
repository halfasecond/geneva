import type { Express as ExpressType } from 'express';
import type { Server as SocketServer } from 'socket.io';
import type { Connection } from 'mongoose';
import type { default as Web3Type } from 'web3';

// Define a more permissive type that matches both Express instances
type AnyExpress = {
    use: Function;
    [key: string]: any;
};

// Define a more permissive type that matches both Socket.io instances
type AnySocketServer = {
    on: Function;
    emit: Function;
    [key: string]: any;
};

declare function modules(
    app: AnyExpress,
    io: AnySocketServer,
    web3: Web3Type | any,
    db: Connection
): void;

export default modules;
