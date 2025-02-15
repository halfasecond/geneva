import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../../../server/types';
import { LivePlayer } from '../../../server/modules/chained-horse/socket/state/players';

interface UseGameServerProps {
    // These props are kept for backwards compatibility
    // but we'll use hardcoded values for now
    _horseId?: string;
    _initialPosition?: Position;
}

// Environment configuration - handle various falsy values
const IS_SERVERLESS = import.meta.env.VITE_SERVERLESS?.toLowerCase() === 'true';

// Hardcoded test values
const TEST_ADDRESS = "0x51Ad709f827C6eC2Ed07269573abF592F83ED50c";

export function useGameServer(_props: UseGameServerProps) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [remotePlayers, setRemotePlayers] = useState<Map<string, LivePlayer>>(new Map());
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Log player state every 10 seconds
    useEffect(() => {
        if (IS_SERVERLESS) return;

        const interval = setInterval(() => {
            console.log('\n=== Frontend Player State ===');
            console.log('Connected:', connected);
            console.log('Remote Players:', Array.from(remotePlayers.values()).map(player => ({
                address: player.address,
                avatarHorse: player.avatarHorseId,
                position: { x: player.x, y: player.y, direction: player.direction },
                connected: player.connected
            })));
            console.log('==========================\n');
        }, 10000);

        return () => clearInterval(interval);
    }, [connected, remotePlayers]);

    // Initialize socket connection
    const initSocket = useCallback(() => {
        if (IS_SERVERLESS || socketRef.current?.connected) return;

        // Use environment variable with fallback for development
        const serverUrl = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3131';
        const socket = io(`${serverUrl}/api/chained-horse`, {
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to game server');
            setConnected(true);
            reconnectAttempts.current = 0;
            // Request initial state for other players
            socket.emit('players:get_state');
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from game server:', reason);
            setConnected(false);
            // Only clear remote players on disconnect
            setRemotePlayers(new Map());
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            reconnectAttempts.current++;
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                socket.disconnect();
            }
        });

        // Handle full state updates
        socket.on('players:state', (livePlayers: LivePlayer[]) => {
            console.log('Received players:state update:', livePlayers);
            const playerMap = new Map();
            livePlayers.forEach(player => {
                // Keep all players in the map
                playerMap.set(player.address, player);
            });
            setRemotePlayers(playerMap);
        });

        // Handle individual player moves
        socket.on('player:moved', ({ address, x, y, direction }: { 
            address: string;
            x: number;
            y: number;
            direction: 'left' | 'right';
        }) => {
            setRemotePlayers(prev => {
                const player = prev.get(address);
                if (player) {
                    const updated = new Map(prev);
                    updated.set(address, { ...player, x, y, direction });
                    return updated;
                }
                return prev;
            });
        });

        return () => {
            if (socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Initialize socket on mount
    useEffect(() => {
        initSocket();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [initSocket]);

    // Broadcast position updates but don't wait for response
    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('player:move', {
                x: position.x,
                y: position.y,
                direction: position.direction
            });
        }
    }, []);

    // If in serverless mode, return empty state
    if (IS_SERVERLESS) {
        return {
            connected: false,
            updatePosition: () => {},
            players: new Map()
        };
    }

    return {
        connected,
        updatePosition,
        players: remotePlayers
    };
}
