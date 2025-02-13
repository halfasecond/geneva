import { Plugin } from 'vite'
import { Server } from 'socket.io'
import Web3 from 'web3'
import { EventEmitter } from 'events'
import { setupGitHubServer } from './github'
import { initializeModules, cleanupModules, ModuleContext } from './modules'
import cors from 'cors'
import express, { Express } from 'express'
import dotenv from 'dotenv'
import path from 'path'

const REQUIRED_ENV_VARS = [
    'WEB3_SOCKET_URL'
] as const;

function hasRequiredEnvVars(): boolean {
    return REQUIRED_ENV_VARS.every(envVar => !!process.env[envVar]);
}

export function gameServer(): Plugin {
    return {
        name: 'vite-plugin-game-server',
        config(config, { command }) {
            // Load environment variables based on mode
            const envFile = command === 'serve' ? '.env' : '.env.production'
            dotenv.config({
                path: path.resolve(process.cwd(), envFile)
            })
        },
        async configureServer(server) {
            // Add CORS and JSON parsing middleware
            server.middlewares.use(cors())
            server.middlewares.use(express.json())

            // Check for required environment variables
            if (!hasRequiredEnvVars()) {
                const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
                console.warn('⚠️ Web3 integration disabled. Missing environment variables:', missing.join(', '));
                return;
            }

            try {
                // Set up Socket.io server
                const io = new Server(server.httpServer!, {
                    cors: {
                        origin: process.env.CORS_ORIGINS?.split(',') || '*',
                        methods: ['GET', 'POST']
                    }
                });

                // Set up Web3 connection
                const web3 = new Web3(process.env.WEB3_SOCKET_URL!);

                // Create event emitter
                const emitter = new EventEmitter();

                // Create Express app
                const app: Express = express();
                
                // Mount Express app on Vite middleware
                server.middlewares.use(app);

                // Create module context
                const context: ModuleContext = {
                    app,
                    io,
                    web3,
                    emitter,
                    config: {
                        prefix: 'geneva',
                        web3SocketUrl: process.env.WEB3_SOCKET_URL!
                    }
                };

                // Initialize modules
                await initializeModules(context);

                // Set up GitHub API server
                setupGitHubServer(server.middlewares);

                // Log when server is ready
                server.httpServer?.once('listening', () => {
                    const address = server.httpServer?.address();
                    if (address && typeof address !== 'string') {
                        console.log(`🐎 Game server running on port ${address.port}`);
                        console.log('🐎 GitHub API endpoints available at /api/github');
                        console.log('🐎 Web3 integration active');
                    }
                });

                // Cleanup on close
                server.httpServer?.once('close', async () => {
                    await cleanupModules();
                    console.log('🐎 Cleaned up modules');
                });
            } catch (error) {
                console.error('Error setting up servers:', error);
                throw error;
            }
        }
    }
}
