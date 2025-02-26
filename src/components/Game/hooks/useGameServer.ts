import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../../../server/types';
import { Actor, WorldState } from '../../../server/types/actor';
import { usePerformanceMetrics } from './usePerformanceMetrics';

interface UseGameServerProps {
    tokenId?: number; 
    token: string;
    onStaticActors?: (actors: Actor[]) => void;
}

// Default state for view mode
const defaultState = {
    connected: false,
    updatePosition: () => {},
    updatePlayerIntroStatus: () => {},
    actors: [],
    player: undefined,
    gameSettings: {
        tickRate: 100,
        movementSpeed: 3.75,
        broadcastFrames: 5,
        smoothing: 0.1
    },
    socket: null,
    scareCityState: null
};

interface GameSettings {
    tickRate: number;
    movementSpeed: number;
    broadcastFrames: number;
    smoothing: number;
}

export function useGameServer({ tokenId, token, onStaticActors }: UseGameServerProps) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [actors, setActors] = useState<Actor[]>([]);
    const [gameSettings, setGameSettings] = useState<GameSettings>({
        tickRate: 100, // Default values, will be overridden by server
        movementSpeed: 3.75,
        broadcastFrames: 5,
        smoothing: 0.1
    });
    const [block, setBlock] = useState(undefined);
    const [scareCityState, setScareCityState] = useState<any>(null);
    const { metrics, trackMovementUpdate, trackServerResponse, trackLatency } = usePerformanceMetrics();
    const lastPingTime = useRef<number>(0);
    const lastStateUpdate = useRef<number>(performance.now());
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Initialize socket connection
    useEffect(() => {
        if (tokenId && token) {
            // Clean up existing socket if any
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            // Use environment variable with fallback for development
            const serverUrl = import.meta.env.VITE_APP_GAME_SERVER_URL;
            const socket = io(`${serverUrl}chained-horse`, {
                reconnection: true,
                reconnectionAttempts: maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                transports: ['websocket'],
                auth: {
                    token  // Pass JWT token for authentication
                }
            });
            socketRef.current = socket;

            // Track socket.io latency
            let lastPingSent = 0;
            const pingInterval = setInterval(() => {
                lastPingSent = performance.now();
                socket.emit('ping');
            }, 1000);

            socket.on('pong', () => {
                const latency = Math.round(performance.now() - lastPingSent);
                trackLatency(latency);
            });

            const handleConnect = () => {
                console.log('Connected to game server');
                reconnectAttempts.current = 0;
                
                // Join game with authenticated token
                socket.emit('player:join', { tokenId });
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
                const now = performance.now();
                const timeSinceLastUpdate = now - lastStateUpdate.current;
                lastStateUpdate.current = now;
                // Only track if it's not the first update and within reasonable time
                if (timeSinceLastUpdate < 5000) { // Ignore gaps > 5s (likely disconnects)
                    trackServerResponse(timeSinceLastUpdate);
                }
                setActors(state.actors);
            };

            const handleStaticActors = (actors: Actor[]) => {
                onStaticActors?.(actors);
            };

            const handleGameSettings = (settings: GameSettings) => {
                setGameSettings(settings);
            };

            // Handle ScareCityGame state
            const handleScareCityState = (state: any) => {
                console.log('ScareCityGame State:', state);
                setScareCityState(state);
            };

            const handleScareCityReset = (data: any) => {
                console.log('ScareCityGame Reset:', data);
            };

            const handleTraitFound = (data: any) => {
                console.log('ScareCityGame Trait Found:', data);
            };

            const handleBecameGhost = (data: any) => {
                console.log('ScareCityGame Became Ghost:', data);
            };

            // Set up event handlers
            const handleError = (error: { message: string }) => {
                console.error('Game server error:', error.message);
                // Disconnect on auth/ownership errors
                if (error.message.includes('auth') || error.message.includes('own')) {
                    socket.disconnect();
                    setConnected(false);
                    setActors([]);
                }
            };

            // Set up event handlers
            socket.on('connect', handleConnect);
            socket.on('player:joined', handleJoined);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);
            socket.on('world:state', handleWorldState);
            socket.on('static:actors', handleStaticActors);
            socket.on('game:settings', handleGameSettings);
            socket.on('error', handleError);
            socket.on('newEthBlock', (_block: any) => setBlock(_block));

            // ScareCityGame events
            socket.on('scarecity:gameState', handleScareCityState);
            socket.on('scarecity:reset', handleScareCityReset);
            socket.on('scarecity:traitFound', handleTraitFound);
            socket.on('scarecity:becameGhost', handleBecameGhost);

            return () => {
                clearInterval(pingInterval);
                socket.off('connect', handleConnect);
                socket.off('player:joined', handleJoined);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
                socket.off('world:state', handleWorldState);
                socket.off('static:actors', handleStaticActors);
                socket.off('game:settings', handleGameSettings);
                socket.off('error', handleError);
                socket.off('pong');
                socket.off('scarecity:gameState', handleScareCityState);
                socket.off('scarecity:reset', handleScareCityReset);
                socket.off('scarecity:traitFound', handleTraitFound);
                socket.off('scarecity:becameGhost', handleBecameGhost);
                socket.removeAllListeners();
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [tokenId, token]);  // Re-initialize socket when tokenId or token changes

    // Broadcast position updates but don't wait for response
    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current?.connected && connected) {
            trackMovementUpdate(); // Track movement frequency
            socketRef.current.emit('player:move', {
                x: position.x,
                y: position.y,
                direction: position.direction
            });
        }
    }, [connected, trackMovementUpdate]);

    const updatePlayerIntroStatus = useCallback((race: any) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('player:complete_tutorial', race)
        }
    }, [connected]);

    // View mode - still connect for world state, but no actions
    if (!tokenId) {
        return {
            ...defaultState,
            actors,  // Show world state
            connected,  // Show connection state
            metrics,  // Include performance metrics
            scareCityState,
            socket: socketRef.current
        };
    }

    // No token - can't connect
    if (!token) {
        return { ...defaultState, metrics };
    }

    const player = actors.find(actor => actor.id === tokenId)

    return {
        connected,
        updatePosition,
        updatePlayerIntroStatus,
        introActive: player?.race === undefined,
        player,
        position: player?.position,
        actors,
        gameSettings,
        metrics,
        block,
        scareCityState,
        socket: socketRef.current
    };
}
