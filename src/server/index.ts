import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') })

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import configureExpress from './config/express'
import { createHttpWeb3 } from './config/web3'
import db from './config/db'
import runModules, { stopBlockIndexer } from './modules'
import { resolveRpcUrl } from './indexer'

process.on('unhandledRejection', (reason) => {
    console.error('[api] unhandledRejection', reason)
})

const { PORT } = process.env

if (!process.env.RPC_URL && !process.env.WEB3_SOCKET_URL) {
    throw new Error('RPC_URL or WEB3_SOCKET_URL environment variable is required')
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: { origin: true, methods: ['GET', 'POST'] },
})

// Configure Express
configureExpress(app)

// Create Web3 connection
const { http } = resolveRpcUrl()
const web3 = createHttpWeb3(http)

// Cleanup function
const cleanup = async () => {
    console.log('\n🎮 Cleaning up game server...')
    
    // Close Socket.IO
    await new Promise(resolve => io.close(resolve))
    
    // Close HTTP server
    await new Promise(resolve => server.close(resolve))
    
    // Close MongoDB connection
    await db.close()
    
    stopBlockIndexer()

    // Close Web3 connection
    if (web3?.currentProvider?.disconnect) {
        web3.currentProvider.disconnect()
    }
    
    console.log('✅ All connections closed')
    
    // Exit process
    process.exit(0)
}

// Handle cleanup signals
process.once('SIGINT', cleanup)
process.once('SIGTERM', cleanup)

// MongoDB connection
db.once("open", () => {
    // Initialize modules
    runModules(app, io, web3, db)
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})
