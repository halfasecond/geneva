import { Plugin } from 'vite'
import { setupSocketServer } from './socket'
import { setupGitHubServer } from './github'
import cors from 'cors'
import express from 'express'
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
        configureServer(server) {
            // Add CORS and JSON parsing middleware
            server.middlewares.use(cors())
            server.middlewares.use(express.json())

            try {
                // Set up Socket.io server
                setupSocketServer(server.httpServer!)

                // Set up GitHub API server
                setupGitHubServer(server.middlewares)

                // Log when server is ready
                server.httpServer?.once('listening', () => {
                    const address = server.httpServer?.address()
                    if (address && typeof address !== 'string') {
                        console.log(`🐎 Game server running on port ${address.port}`)
                        console.log('🐎 GitHub API endpoints available at /api/github')
                    }
                })
            } catch (error) {
                console.error('Error setting up servers:', error)
                throw error
            }
        }
    }
}
