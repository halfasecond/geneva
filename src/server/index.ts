import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from src/server/.env
dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

// Debug environment variables
console.log('Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  WEB3_SOCKET_URL: process.env.WEB3_SOCKET_URL,
  PORT: process.env.PORT
});

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import configureExpress from './config/express';
import createWeb3Connection from './config/web3';
import db from './config/db';
import runModules from './modules';

const { PORT, WEB3_SOCKET_URL } = process.env;

if (!WEB3_SOCKET_URL) {
  throw new Error('WEB3_SOCKET_URL environment variable is required');
}

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configure Express
configureExpress(app);

// Create Web3 connection
const web3 = createWeb3Connection(WEB3_SOCKET_URL);

// Cleanup function
const cleanup = async () => {
  console.log('\n🎮 Cleaning up game server...');
  
  // Close Socket.IO
  await new Promise(resolve => io.close(resolve));
  
  // Close HTTP server
  await new Promise(resolve => server.close(resolve));
  
  // Close MongoDB connection
  await db.close();
  
  // Close Web3 connection
  if (web3?.currentProvider?.disconnect) {
    web3.currentProvider.disconnect();
  }
  
  console.log('✅ All connections closed');
  
  // Exit process
  process.exit(0);
};

// Handle cleanup signals
process.once('SIGINT', cleanup);
process.once('SIGTERM', cleanup);

// MongoDB connection
db.once("open", () => {
  // Initialize modules
  runModules(app, io, web3, db);
  
  // Start server
  server.listen(PORT || 3131, () => {
    console.log(`Server running on port ${PORT || 3131}`);
  });
});
