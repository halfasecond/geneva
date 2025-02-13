import express from 'express';
import { Express } from './types/express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import modules from './modules';
import createWeb3Connection from './config/web3';

// Load environment variables
dotenv.config();

const { PORT, MONGODB_URI, WEB3_SOCKET_URL } = process.env;

if (!WEB3_SOCKET_URL) {
    throw new Error('WEB3_SOCKET_URL environment variable is required');
}

const startServer = async () => {
    // Create Express app with proper typing
    const app = express() as Express;
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    try {
        // Connect to MongoDB using createConnection
        console.log('Connecting to MongoDB...');
        const db = await mongoose.createConnection(MONGODB_URI);
        console.log('Successfully connected to MongoDB');

        // Initialize Web3 with proper WebSocket configuration
        console.log('Initializing Web3 connection...');
        const web3 = createWeb3Connection(WEB3_SOCKET_URL);

        // Initialize modules with db connection
        modules(app, io, web3, db);

        // Start server
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
