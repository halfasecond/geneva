import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../../../server/types';
import { Actor, WorldState } from '../../../server/types/actor';
import { ghostFound } from 'src/audio';

interface Message {
    message: string;
    account: string;
    timestamp?: number;
    avatar?: number;
}

interface Props {
    tokenId?: number; 
    token?: string;
}

interface CommsState {
    messages: Message[];
    notifications?: any[];
    addMessage: (message: string) => void;
}

// Default state for view mode
const defaultState: CommsState = {
    messages: [],
    notifications: [],
    addMessage: () => {}
};

export function useGameServer({ tokenId, token }: Props): CommsState {
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

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
                    token
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
                socket.emit('player:join', { tokenId });
            };

            const handleJoined = () => {
                console.log('Joined game successfully');
                setConnected(true);
            };

            const handleDisconnect = (reason: string) => {
                console.log('Disconnected from game server:', reason);
                setConnected(false);
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
            };
            const handleBecameGhost = (data: any) => {};

            const handleMessages = (data: any) => {
                setMessages(data)
            }

            const handleNotification = (data: any) => {
                setNotifications((prev) => {
                    return [...prev, data]
                })
            }

            const handleError = (error: { message: string }) => {
                console.error('Game server error:', error.message);
                if (error.message.includes('auth') || error.message.includes('own')) {
                    socket.disconnect();
                    setConnected(false);
                    setActors([]);
                }
            };

            socket.on('connect', handleConnect);
            socket.on('player:joined', handleJoined);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);
            socket.on('world:state', handleWorldState);
            socket.on('static:actors', handleStaticActors);
            socket.on('game:settings', handleGameSettings);
            socket.on('error', handleError);
            socket.on('newEthBlock', (_block: any) => setBlock(_block));
            socket.on('scarecity:gameState', handleScareCityState);
            socket.on('scarecity:reset', handleScareCityReset);
            socket.on('scarecity:traitFound', handleTraitFound);
            socket.on('scarecity:becameGhost', handleBecameGhost);
            socket.on('notification', (data: any) => handleNotification(data));
            socket.on('messages', handleMessages);

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

    const addMessage = (message) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('addMessage', message);
        }
    }

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
        messages,
        addMessage
    };
}
