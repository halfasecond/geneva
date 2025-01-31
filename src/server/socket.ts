// @ts-nocheck
import { Server } from 'socket.io'
import { Position } from './types'

interface Player {
    id: string
    position: Position
}

export function setupSocketServer(httpServer: any) {
    const io = new Server(httpServer)

    io.on('connection', (socket) => {
        console.log('🐎 New connection')

        socket.on('horse:join', ({ id, position }: Player) => {
            console.log(`🐎 Horse ${id} joined at (${position.x}, ${position.y})`)
            socket.broadcast.emit('horse:join', { id, position })
        })

        socket.on('horse:move', ({ id, position }: Player) => {
            console.log(`🐎 Horse ${id} moved to (${position.x}, ${position.y}) facing ${position.direction}`)
            socket.broadcast.emit('horse:move', { id, position })
        })

        socket.on('disconnect', () => {
            const horseId = Array.from(socket.rooms)[0] // Get the first room (socket's own room)
            console.log(`🐎 Horse ${horseId} left the paddock`)
            io.emit('horse:leave', horseId)
        })
    })
}

// Re-export for backward compatibility
export const setupSocket = setupSocketServer
