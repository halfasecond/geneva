import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import mongoose from 'mongoose'
import { SocketController } from './controllers/SocketController'
import { config } from './config'

const app = express()
const httpServer = createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paddock')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err))

// Socket controller
const socketController = new SocketController(io)
io.on('connection', (socket) => {
    socketController.handleConnection(socket)
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...')
    socketController.shutdown()
    httpServer.close(() => {
        console.log('HTTP server closed')
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed')
            process.exit(0)
        })
    })
})
