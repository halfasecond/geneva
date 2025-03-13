import { Plugin } from 'vite';
import { Server as SocketServer } from 'socket.io';
import { EventEmitter } from 'events';
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import modules from './modules';
import createWeb3Connection from './config/web3';

// Track active connections for cleanup
let io: SocketServer | null = null;
let db: mongoose.Connection | null = null;
let web3: any = null;

const cleanup = () => {
    console.log('\n🐎 Shutting down game server...');
    
    if (web3?.currentProvider) {
        console.log('Closing Web3 connections...');
        web3.currentProvider.disconnect();
    }

    if (db) {
        console.log('Closing MongoDB connection...');
        db.close();
    }

    if (io) {
        console.log('Closing Socket.IO connections...');
        io.close();
    }

    // Exit after cleanup
    process.exit(0);
};

export function gameServer(): Plugin {
    return {
        name: 'vite-plugin-game-server',
        config(config, { command }) {
            // Load environment variables based on mode
            const envFile = command === 'serve' ? '.env' : '.env.production';
            dotenv.config({
                path: path.resolve(process.cwd(), envFile)
            });
        },
        async configureServer(server) {
            const { MONGODB_URI, WEB3_SOCKET_URL, CORS_ORIGINS, VITE_ENABLE_INDEXER } = process.env;

            if (!MONGODB_URI || !WEB3_SOCKET_URL) {
                throw new Error('Missing required environment variables');
            }

            try {
                // Set up Socket.io server
                io = new SocketServer(server.httpServer!, {
                    cors: {
                        origin: CORS_ORIGINS?.split(',') || '*',
                        methods: ['GET', 'POST']
                    }
                });

                // Create event emitter
                const emitter = new EventEmitter();

                // Create Express app
                const app = express();
                app.use(express.json());
                app.use(cors());

                // Connect to MongoDB
                console.log('Connecting to MongoDB...');
                db = await mongoose.createConnection(MONGODB_URI);
                console.log('Successfully connected to MongoDB');

                // Initialize Web3
                web3 = createWeb3Connection(WEB3_SOCKET_URL);

                // Initialize modules with prefixed routes
                modules(app, io, web3, db);
                
                // Mount Express app on Vite middleware under /api
                server.middlewares.use('/', app);

                // Set up signal handlers for clean shutdown
                process.on('SIGINT', cleanup);
                process.on('SIGTERM', cleanup);

                // Log when server is ready
                server.httpServer?.once('listening', () => {
                    const address = server.httpServer?.address();
                    if (address && typeof address !== 'string') {
                        console.log(`🐎 Game server running on port ${address.port}`);
                        console.log('🐎 API endpoints available at /api');
                        console.log('🐎 Socket.io namespaces ready');
                        if (VITE_ENABLE_INDEXER === 'true') {
                            console.log('🐎 Event indexer enabled');
                        } else {
                            console.log('🐎 Event indexer disabled');
                        }
                    }
                });
            } catch (error) {
                console.error('Error setting up servers:', error);
                throw error;
            }
        }
    };
}
