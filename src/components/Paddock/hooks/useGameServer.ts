import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Position } from '../../../server/types';

interface LivePlayer {
    address: string;
    socketId: string | null;
    connected: boolean;
    lastSeen: Date;
    avatarHorseId: number;
    x: number;
    y: number;
    direction: 'left' | 'right';
    levelIndex: number;
}

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
    const socketRef = useRef<any>(null);
    const [players, setPlayers] = useState<Map<string, LivePlayer>>(new Map());
    const [connected, setConnected] = useState(false);

    // Log player state every 10 seconds
    useEffect(() => {
        if (IS_SERVERLESS) return;

        const interval = setInterval(() => {
            console.log('\n=== Frontend Player State ===');
            console.log('Connected:', connected);
            console.log('Players:', Array.from(players.values()).map(player => ({
                address: player.address,
                avatarHorse: player.avatarHorseId,
                position: { x: player.x, y: player.y, direction: player.direction },
                connected: player.connected
            })));
            console.log('==========================\n');
        }, 10000);

        return () => clearInterval(interval);
    }, [connected, players]);

    useEffect(() => {
        if (IS_SERVERLESS) return;

        // Use environment variable with fallback for development
        const serverUrl = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3131';
        const socket = io(serverUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to game server');
            setConnected(true);
            // Initial position will be set by server's test player
            socket.emit('players:get_state');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            setConnected(false);
            setPlayers(new Map());
        });

        // Handle full state updates
        socket.on('players:state', (livePlayers: LivePlayer[]) => {
            console.log('Received players:state update:', livePlayers);
            const playerMap = new Map();
            livePlayers.forEach(player => {
                playerMap.set(player.address, player);
            });
            setPlayers(playerMap);
        });

        // Handle individual player moves
        socket.on('player:moved', ({ address, x, y, direction }: { 
            address: string;
            x: number;
            y: number;
            direction: 'left' | 'right';
        }) => {
            setPlayers(prev => {
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

    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current && connected) {
            socketRef.current.emit('player:move', {
                x: position.x,
                y: position.y,
                direction: position.direction
            });
        }
    }, [connected]);

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
        players
    };
}
