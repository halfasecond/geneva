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

export function useGameServer({ horseId, initialPosition }: UseGameServerProps) {
    const socketRef = useRef<any>(null)
    const [players, setPlayers] = useState<Map<string, Player>>(new Map())
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        const socket = io('http://localhost:3131')
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
            socket.disconnect()
            socketRef.current = null
        }
    }, [])

    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('horse:move', { id: horseId, position })
        }
    }, [horseId, connected])

    return {
        connected,
        updatePosition,
        players
    }
}
