// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { Position } from '../../../server/types'

interface Player {
    id: string
    position: Position
}

interface UseGameServerProps {
    horseId: string
    initialPosition: Position
}

// Environment configuration
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS === 'true'

export function useGameServer({ horseId, initialPosition }: UseGameServerProps) {
    const socketRef = useRef<any>(null)
    const [players, setPlayers] = useState<Map<string, Player>>(new Map())
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        if (IS_SERVERLESS) return;

        // Use environment variable with fallback for development
        const serverUrl = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3131'
        const socket = io(serverUrl)
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Connected to game server')
            setConnected(true)
            socket.emit('horse:join', { id: horseId, position: initialPosition })
        })

        socket.on('disconnect', () => {
            console.log('Disconnected from game server')
            setConnected(false)
        })

        socket.on('horse:join', ({ id, position }: Player) => {
            if (id !== horseId) {
                setPlayers(prev => new Map(prev).set(id, { id, position }))
            }
        })

        socket.on('horse:move', ({ id, position }: Player) => {
            if (id !== horseId) {
                setPlayers(prev => new Map(prev).set(id, { id, position }))
            }
        })

        return () => {
            if (socket) {
                socket.disconnect()
                socketRef.current = null
            }
        }
    }, [])

    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('horse:move', { id: horseId, position })
        }
    }, [horseId, connected])

    // If in serverless mode, return empty state
    if (IS_SERVERLESS) {
        return {
            connected: false,
            updatePosition: () => {},
            players: new Map()
        }
    }

    return {
        connected,
        updatePosition,
        players
    }
}
