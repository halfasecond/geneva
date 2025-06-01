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
    greaterTractorState: any;
    greaterTractorPlayerState: any;
    scanTrait: ScanTraitFn;
    messages: Message[];
    notifications?: any[];
    removeNotification: (id: string) => void;
    addMessage: (message: string) => void;
    upgradeStable?: (stable: number) => void;
    voteForTractor?: (direction: 'left' | 'right') => void;
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
    greaterTractorState: null,
    greaterTractorPlayerState: { hasVoted: false, vote: undefined },
    messages: [],
    notifications: [],
    metrics: {},
    block: null,
    scanTrait: () => {},
    removeNotification: () => {},
    addMessage: () => {},
    upgradeStable: () => {},
    voteForTractor: () => {}
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
    const [greaterTractorState, setGreaterTractorState] = useState<any>(null);
    const [greaterTractorPlayerState, setGreaterTractorPlayerState] = useState<any>({
        hasVoted: false,
        vote: undefined,
        loading: false
    });
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
    
    // Handle notification function (moved outside useEffect for reuse)
    const handleNotification = useCallback((data: any) => {
        const _data = {
            ...data,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        };
        setNotifications((prev) => {
            return [...prev, _data]
        })
    }, []);

    // Initialize socket connection
    useEffect(() => {
        if (tokenId && token) {
            // Clean up existing socket if any
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            // Use environment variable with fallback for development
            const serverUrl = import.meta.env.VITE_APP_ENDPOINT;
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

            const handleGreaterTractorState = (state: any) => {
                setGreaterTractorState(state);
            };

            const handleGreaterTractorPlayerState = (state: any) => {
                // Update state and clear loading
                setGreaterTractorPlayerState({
                    hasVoted: state.hasVoted,
                    vote: state.vote,
                    loading: false
                });
                
                // If the player has voted, show a notification
                if (state.hasVoted && state.vote) {
                    handleNotification({
                        type: 'greater_tractor_vote',
                        direction: state.vote,
                        message: `Your vote for the ${state.vote} tractor has been recorded!`
                    });
                }
            };

            const handleGreaterTractorReset = (data: any) => {
                console.log('Greater Tractor game reset');
                // Reset player's vote state
                setGreaterTractorPlayerState({
                    hasVoted: false,
                    vote: undefined,
                    loading: false
                });
            };

            const handleGreaterTractorResults = (data: any) => {
                handleNotification(data);
            };
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

            // Use the handleNotification function defined outside

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
            socket.on('greaterTractor:state', handleGreaterTractorState);
            socket.on('greaterTractor:playerState', handleGreaterTractorPlayerState);
            socket.on('greaterTractor:reset', handleGreaterTractorReset);
            socket.on('greaterTractor:results', handleGreaterTractorResults);
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
                socket.off('greaterTractor:state', handleGreaterTractorState);
                socket.off('greaterTractor:playerState', handleGreaterTractorPlayerState);
                socket.off('greaterTractor:reset', handleGreaterTractorReset);
                socket.off('greaterTractor:results', handleGreaterTractorResults);
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

    const voteForTractor = useCallback((direction: 'left' | 'right') => {
        if (socketRef.current?.connected && connected) {
            // Check if player has already voted or if a vote is in progress
            if (greaterTractorPlayerState.hasVoted || greaterTractorPlayerState.loading) {
                console.log(`Already voted for ${greaterTractorPlayerState.vote} tractor or vote in progress`);
                // Add notification to remind the user of their vote
                if (greaterTractorPlayerState.hasVoted) {
                    handleNotification({
                        type: 'greater_tractor_vote',
                        direction: greaterTractorPlayerState.vote,
                        message: `You voted for the ${greaterTractorPlayerState.vote} tractor`
                    });
                }
                return;
            }
            
            // Set loading state
            setGreaterTractorPlayerState((prev: any) => ({
                ...prev,
                loading: true
            }));
            
            // Send vote to server
            socketRef.current.emit('greaterTractor:vote', { direction });
            console.log(`Voting for ${direction} tractor...`);
            
            // The server will send back the updated player state via the greaterTractor:playerState event
            // We don't update the local state here, we wait for the server to confirm
        }
    }, [connected]);

    if (!tokenId) {
        return {
            ...defaultState,
            actors,
            connected,
            metrics,
            scareCityState,
            greaterTractorState,
            greaterTractorPlayerState,
            messages,
            block: null,
            scanTrait,
            voteForTractor
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
        greaterTractorState,
        greaterTractorPlayerState,
        scanTrait,
        notifications,
        removeNotification,
        messages,
        addMessage,
        upgradeStable,
        voteForTractor
    };
}
