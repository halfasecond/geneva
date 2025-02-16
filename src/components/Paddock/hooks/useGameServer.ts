import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../../../server/types';
import { Actor, WorldState } from '../../../server/types/actor';

interface UseGameServerProps {
    horseId: number;  // Changed from string to number to match NFT tokenIds
    onStaticActors?: (actors: Actor[]) => void;
}

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

// Hardcoded test values
const TEST_ADDRESS = "0x51Ad709f827C6eC2Ed07269573abF592F83ED50c";

export function useGameServer({ horseId, onStaticActors }: UseGameServerProps) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [actors, setActors] = useState<Actor[]>([]);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Initialize socket connection
    useEffect(() => {
        if (IS_SERVERLESS) return;

        // Clean up existing socket if any
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Use environment variable with fallback for development
        const serverUrl = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3131';
        const socket = io(`${serverUrl}/api/chained-horse`, {
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            transports: ['websocket']
        });
        socketRef.current = socket;

        const handleConnect = () => {
            console.log('Connected to game server');
            reconnectAttempts.current = 0;
            
            // Join game
            socket.emit('player:join', {
                address: TEST_ADDRESS,
                horseId  // Already a number, no need to parse
            });
        };

        const handleJoined = () => {
            console.log('Joined game successfully');
            setConnected(true);
        };

        const handleDisconnect = (reason: string) => {
            console.log('Disconnected from game server:', reason);
            setConnected(false);
            // Only clear actors on permanent disconnects
            if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                setActors([]);
            }
        };

        const handleConnectError = (error: Error) => {
            console.error('Connection error:', error);
            reconnectAttempts.current++;
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                socket.disconnect();
            }
        };

        const handleWorldState = (state: WorldState) => {
            setActors(state.actors);
        };

        const handleStaticActors = (actors: Actor[]) => {
            onStaticActors?.(actors);
        };

        // Set up event handlers
        socket.on('connect', handleConnect);
        socket.on('player:joined', handleJoined);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('world:state', handleWorldState);
        socket.on('static:actors', handleStaticActors);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('player:joined', handleJoined);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('world:state', handleWorldState);
            socket.off('static:actors', handleStaticActors);
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [horseId]);

    // Broadcast position updates but don't wait for response
    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('player:move', {
                x: position.x,
                y: position.y,
                direction: position.direction
            });
        }
    }, [connected]);

    const completeTutorial = useCallback(() => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('player:complete_tutorial');
        }
    }, [connected]);

    // If in serverless mode, return empty state
    if (IS_SERVERLESS) {
        return {
            connected: false,
            updatePosition: () => {},
            completeTutorial: () => {},
            actors: []
        };
    }

    return {
        connected,
        updatePosition,
        completeTutorial,
        actors
    };
}
