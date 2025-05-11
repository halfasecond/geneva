import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePerformanceMetrics } from './usePerformanceMetrics';

interface Message {
    message: string;
    account: string;
    timestamp?: number;
    avatar?: number;
}


interface ServerState {
    connected: boolean;
    metrics: any;
    block: any;
    messages: Message[];
    notifications?: any[];
    removeNotification: (id: string) => void;
    addMessage: (message: string) => void;
}

// Default state for view mode
const defaultState: ServerState = {
    connected: false,
    messages: [],
    notifications: [],
    metrics: {},
    block: null,
    removeNotification: () => {},
    addMessage: () => {},
};

export function useSocket({ token }: { token: string }): ServerState {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [block, setBlock] = useState(undefined);
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

    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Initialize socket connection
    useEffect(() => {
        if (token) {
            // Clean up existing socket if any
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            // Use environment variable with fallback for development
            const serverUrl = import.meta.env.VITE_APP_ENDPOINT;
            const socket = io(`${serverUrl}`, {
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
            };

            const handleJoined = () => {
                console.log('Joined game successfully');
                setConnected(true);
            };

            const handleDisconnect = (reason: string) => {
                console.log('Disconnected from game server:', reason);
                setConnected(false);
            };

            const handleConnectError = (error: Error) => {
                console.error('Connection error:', error);
                reconnectAttempts.current++;
                if (reconnectAttempts.current >= maxReconnectAttempts) {
                    console.error('Max reconnection attempts reached');
                    socket.disconnect();
                }
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
                console.error('server error:', error.message);
                if (error.message.includes('auth') || error.message.includes('own')) {
                    socket.disconnect();
                    setConnected(false);
                }
            };

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);
            socket.on('error', handleError);
            socket.on('newEthBlock', (_block: any) => setBlock(_block));
            socket.on('notification', (data: any) => handleNotification(data));
            socket.on('messages', handleMessages);

            return () => {
                clearInterval(pingInterval);
                socket.off('connect', handleConnect);
                socket.off('player:joined', handleJoined);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
                socket.off('messages', handleMessages);
                socket.off('error', handleError);
                socket.off('pong');
                socket.removeAllListeners();
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [token]);

    const addMessage = (message: string) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('addMessage', message);
        }
    }

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, [])

    if (!token) {
        return {
            ...defaultState,
            connected,
            metrics,
            messages,
            block: null,
        };
    }

    if (!token) {
        return { ...defaultState, metrics };
    }

    return {
        connected,
        metrics,
        block,
        notifications,
        removeNotification,
        messages,
        addMessage,
    };
}
