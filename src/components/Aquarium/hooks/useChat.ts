import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    message: string;
    account: string;
    timestamp?: number;
    avatar?: number;
}

interface UseGameServerProps {
    tokenId?: number; 
    token?: string;
}

interface GameServerState {
    connected: boolean;
    messages: Message[];
    notifications?: any[];
    removeNotification: (id: string) => void;
    addMessage: (message: string) => void;
    saveTank: (tank: any) => void;
    getTank: () => void;
    tankSaved: any | undefined;
    tank: any | undefined;
}

// Default state for view mode
const defaultState: GameServerState = {
    connected: false,
    messages: [],
    notifications: [],
    removeNotification: () => {},
    addMessage: () => {},
    saveTank: () => {},
    getTank: () => {},
    tankSaved: undefined,
    tank: undefined
}

export function useChat({ token }: UseGameServerProps): GameServerState {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<any[]>([
        // { 
        //     id: "1741501270328-0uu5kh8",
        //     time: 14251,
        //     tokenId: 21,
        //     type:"newbIslandRace"
        // }
    ]);
    const [tankSaved, setTankSaved] = useState(undefined)
    const [tank, setTank] = useState(undefined)

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
            const appName = import.meta.env.VITE_APP;
            const socket = io(`${serverUrl}${appName}`, {
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

            const handleConnect = () => {
                reconnectAttempts.current = 0;
                setConnected(true);
                getTank();
            };

            const handleDisconnect = () => {
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

            const handleTankSaved = (data: any) => {
                setTankSaved(data)
            }

            const handleTankLoaded = (data: any) => {
                setTank(data)
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
                console.error('Game server error:', error.message);
                if (error.message.includes('auth') || error.message.includes('own')) {
                    socket.disconnect();
                    setConnected(false);
                }
            };

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);
            socket.on('error', handleError);
            socket.on('notification', (data: any) => handleNotification(data));
            socket.on('messages', handleMessages);
            socket.on('tankSaved', handleTankSaved);
            socket.on('tankLoaded', handleTankLoaded);

            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
                socket.off('messages', handleMessages);
                socket.off('tankSaved', handleTankSaved);
                socket.off('tankLoaded', handleTankLoaded);
                socket.off('error', handleError);
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

    const saveTank = (tank: any) => {
        if (socketRef.current?.connected && connected) {
            socketRef.current.emit('saveTank', tank);
        }
    }

    const getTank = () => {
        if (socketRef.current) {
            socketRef.current.emit('getTank');
        }
    }

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, [])

    if (!token) {
        return {
            ...defaultState,
            connected,
            messages,
        };
    }

    if (!token) {
        return { ...defaultState };
    }

    return {
        connected,
        notifications,
        removeNotification,
        messages,
        addMessage,
        saveTank,
        tankSaved,
        getTank,
        tank
    };
}
