import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../../../server/types';
import { Actor, WorldState } from '../../../server/types/actor';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import { ghostFound } from 'src/audio';
import { Namespace } from 'socket.io';

interface Message {
    message: string;
    account: string;
    timestamp?: number;
    avatar?: number;
}

interface UseGameServerProps {
    tokenId?: number; 
    token?: string;
    onStaticActors?: (actors: Actor[]) => void;
}

type ScanTraitFn = (data: { scanType: string; scanResult: string; tokenId: number; }) => void;

interface GameServerState {
    connected: boolean;
    updatePosition: (position: Position) => void;
    updatePlayerIntroStatus: (race: any) => void;
    introActive?: boolean;
    player?: Actor;
    hay?: number;
    position?: Position;
    actors: Actor[];
    gameSettings: {
        tickRate: number;
        movementSpeed: number;
        broadcastFrames: number;
        smoothing: number;
    };
    metrics: any;
    block: any;
    scareCityState: any;
    scanTrait: ScanTraitFn;
    messages: Message[];
    notifications?: any[];
    removeNotification: (id: string) => void;
    addMessage: (message: string) => void;
    upgradeStable?: (stable: number) => void;
    sendGolfCommand?: (command: string) => void; // Add function to send golf commands
}

// Default state for view mode
const defaultState: GameServerState = {
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
    scareCityState: null,
    messages: [],
    notifications: [],
    metrics: {},
    block: null,
    scanTrait: () => {},
    removeNotification: () => {},
    addMessage: () => {},
    upgradeStable: () => {},
    sendGolfCommand: () => {}
};

interface GameSettings {
    tickRate: number;
    movementSpeed: number;
    broadcastFrames: number;
    smoothing: number;
}

export function useGameServer({ tokenId, token, onStaticActors }: UseGameServerProps): GameServerState {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [actors, setActors] = useState<Actor[]>([]);
    const [gameSettings, setGameSettings] = useState<GameSettings>({
        tickRate: 100,
        movementSpeed: 3.75,
        broadcastFrames: 5,
        smoothing: 0.1
    });
    const [block, setBlock] = useState(undefined);
    const [scareCityState, setScareCityState] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<any[]>([
        // { 
        //     id: "1741501270328-0uu5kh8",
        //     time: 14251,
        //     tokenId: 21,
        //     type:"newbIslandRace"
        // }
    ]);
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
console.log('useGameServer: Connecting to server URL:', serverUrl);
console.log('useGameServer: Token available:', !!token);

const socket = io(`${serverUrl}chained-horse`, {
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket'],
    auth: {
        token
    }
});

console.log('useGameServer: Socket created:', !!socket);
socketRef.current = socket;
console.log('useGameServer: Socket reference set');
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
                console.log('useGameServer: Connected to game server');
                reconnectAttempts.current = 0;
                console.log('useGameServer: Emitting player:join with tokenId:', tokenId);
                socket.emit('player:join', { tokenId });
            };

            const handleJoined = () => {
                console.log('useGameServer: Joined game successfully');
                setConnected(true);
                console.log('useGameServer: Connected state set to true');
            };

            const handleDisconnect = (reason: string) => {
                console.log('useGameServer: Disconnected from game server:', reason);
                setConnected(false);
                console.log('useGameServer: Connected state set to false');
                if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                    setActors([]);
                    console.log('useGameServer: Actors cleared due to disconnect');
                }
            };

            const handleConnectError = (error: Error) => {
                console.error('useGameServer: Connection error:', error);
                reconnectAttempts.current++;
                console.log(`useGameServer: Reconnect attempt ${reconnectAttempts.current} of ${maxReconnectAttempts}`);
                if (reconnectAttempts.current >= maxReconnectAttempts) {
                    console.error('useGameServer: Max reconnection attempts reached');
                    socket.disconnect();
                }
            };

            const handleWorldState = (state: WorldState) => {
                const now = performance.now();
                const timeSinceLastUpdate = now - lastStateUpdate.current;
                lastStateUpdate.current = now;
                if (timeSinceLastUpdate < 5000) {
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

            const handleScareCityState = (state: any) => {
                setScareCityState(state);
            };

            const handleScareCityReset = (data: any) => {};
            const handleTraitFound = (data: any) => {
                ghostFound();
                console.log(data)
                handleNotification(data);
            };
            const handleBecameGhost = (data: any) => {
                console.log(data)
                handleNotification(data)
            };

            const handleMessages = (data: any) => {
                setMessages(data)
            }

            const handleNotification = (data: any) => {
                const _data = {
                    ...data,
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                };
                setNotifications((prev) => {
                    return [...prev, _data]
                })
            }

            const handleError = (error: { message: string }) => {
                console.error('useGameServer: Game server error:', error.message);
                if (error.message.includes('auth') || error.message.includes('own')) {
                    console.log('useGameServer: Auth error detected, disconnecting socket');
                    socket.disconnect();
                    setConnected(false);
                    setActors([]);
                    console.log('useGameServer: Connected state set to false and actors cleared');
                }
            };

            console.log('useGameServer: Registering socket event handlers');
            socket.on('connect', handleConnect);
            socket.on('player:joined', handleJoined);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);
            socket.on('world:state', handleWorldState);
            socket.on('static:actors', handleStaticActors);
            socket.on('game:settings', handleGameSettings);
            socket.on('error', handleError);
            socket.on('newEthBlock', (_block: any) => {
                console.log('useGameServer: Received new ETH block');
                setBlock(_block);
            });
            socket.on('scarecity:gameState', handleScareCityState);
            socket.on('scarecity:reset', handleScareCityReset);
            socket.on('scarecity:traitFound', handleTraitFound);
            socket.on('scarecity:becameGhost', handleBecameGhost);
            socket.on('notification', (data: any) => {
                console.log('useGameServer: Received notification', data);
                handleNotification(data);
            });
            socket.on('messages', handleMessages);
            console.log('useGameServer: All socket event handlers registered');

            return () => {
                clearInterval(pingInterval);
                socket.off('connect', handleConnect);
                socket.off('player:joined', handleJoined);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
                socket.off('world:state', handleWorldState);
                socket.off('static:actors', handleStaticActors);
                socket.off('game:settings', handleGameSettings);
                socket.off('messages', handleMessages);
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
    }, [tokenId]);

    const addMessage = (message: string) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('addMessage', message);
        }
    }

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, [])

    const scanTrait = useCallback((data: { 
        scanType: string,
        scanResult: string,
        tokenId: number
    }) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('scarecity:scan', data);
        }
    }, [connected]);

    const updatePosition = useCallback((position: Position) => {
        if (socketRef.current?.connected && connected) {
            trackMovementUpdate();
            socketRef.current.emit('player:move', {
                x: position.x,
                y: position.y,
                direction: position.direction
            });
        }
    }, [connected, trackMovementUpdate]);

    const updatePlayerIntroStatus = useCallback((race: any) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('player:complete_tutorial', race);
        }
    }, [connected]);

    const upgradeStable = useCallback((stable: number) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('player:upgrade_stable', stable);
        }
    }, [connected]);

    const sendGolfCommand = useCallback((command: string) => {
        console.log('useGameServer: Attempting to send golf command:', command);
        console.log('Socket connected status:', connected);
        console.log('Socket reference exists:', !!socketRef.current);
        
        if (socketRef.current?.connected && connected) {
            console.log('useGameServer: Socket is connected, sending command to server');
            socketRef.current.emit('golf:command', { command });
        } else {
            console.warn('useGameServer: Socket is not connected or not available');
        }
    }, [connected]);

    if (!tokenId) {
        return {
            ...defaultState,
            actors,
            connected,
            metrics,
            scareCityState,
            messages,
            block: null,
            scanTrait
        };
    }

    if (!token) {
        return { ...defaultState, metrics };
    }

    const player = actors.find(actor => actor.id === tokenId);

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
        scanTrait,
        notifications,
        removeNotification,
        messages,
        addMessage,
        upgradeStable,
        sendGolfCommand
    };
}
