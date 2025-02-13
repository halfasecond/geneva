import { Plugin } from 'vite'
import { Server } from 'socket.io'
import { EventEmitter } from 'events'
import { setupGitHubServer } from './github'
import cors from 'cors'
import express, { Express } from 'express'
import dotenv from 'dotenv'
import path from 'path'

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

            try {
                // Set up Socket.io server
                const io = new Server(server.httpServer!, {
                    cors: {
                        origin: process.env.CORS_ORIGINS?.split(',') || '*',
                        methods: ['GET', 'POST']
                    }
                });

                // Create event emitter
                const emitter = new EventEmitter();

                // Create Express app
                const app: Express = express();
                
                // Mount Express app on Vite middleware
                server.middlewares.use(app);

                // Set up GitHub API server
                setupGitHubServer(server.middlewares);

                // Log when server is ready
                server.httpServer?.once('listening', () => {
                    const address = server.httpServer?.address();
                    if (address && typeof address !== 'string') {
                        console.log(`🐎 Game server running on port ${address.port}`);
                        console.log('🐎 GitHub API endpoints available at /api/github');
                    }
                });
            } catch (error) {
                console.error('Error setting up servers:', error);
                throw error;
            }
        }
    }
}
