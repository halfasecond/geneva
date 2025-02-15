import { Socket, Namespace } from 'socket.io';
import {
    LivePlayer,
    initializeTestPlayer,
    updatePlayerPosition,
    setPlayerDisconnected,
    getPlayerBySocket,
    getConnectedPlayers,
    setPlayerConnected
} from '../state/players';

interface Position {
    x: number;
    y: number;
    direction: 'left' | 'right';
}

// Track last broadcast time for each player
const lastBroadcastMap = new Map<string, number>();
const BROADCAST_INTERVAL = 50; // 20 updates per second

export const setupPlayerHandlers = (socket: Socket, namespace: Namespace) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Initialize test player on connection
    const player = initializeTestPlayer(namespace, socket);
    if (player) {
        // Set player as connected and broadcast initial state
        setPlayerConnected(namespace, player.address, socket.id);
        
        // Broadcast to all clients including sender
        namespace.emit('players:state', getConnectedPlayers(namespace));

        // Handle player movement
        socket.on('player:move', ({ x, y, direction }: Position) => {
            const currentPlayer = getPlayerBySocket(namespace, socket.id);
            if (currentPlayer && currentPlayer.connected) {
                // Always update server state
                updatePlayerPosition(namespace, currentPlayer.address, x, y, direction);
                
                // Check if we should broadcast
                const now = Date.now();
                const lastBroadcast = lastBroadcastMap.get(currentPlayer.address) || 0;
                
                if (now - lastBroadcast >= BROADCAST_INTERVAL) {
                    // Broadcast to all clients
                    namespace.emit('player:moved', {
                        address: currentPlayer.address,
                        x,
                        y,
                        direction
                    });
                    
                    // Update last broadcast time
                    lastBroadcastMap.set(currentPlayer.address, now);
                    
                    // Log movement for debugging
                    console.log(`Player ${currentPlayer.address} moved:`, { x, y, direction });
                }
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            const currentPlayer = getPlayerBySocket(namespace, socket.id);
            if (currentPlayer) {
                setPlayerDisconnected(namespace, currentPlayer.address);
                // Clean up broadcast tracking
                lastBroadcastMap.delete(currentPlayer.address);
                // Broadcast player disconnection to all clients
                namespace.emit('players:state', getConnectedPlayers(namespace));
            }
        });

        // Handle client requesting current state
        socket.on('players:get_state', () => {
            const players = getConnectedPlayers(namespace);
            socket.emit('players:state', players);
        });

        // Handle socket errors
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
            const currentPlayer = getPlayerBySocket(namespace, socket.id);
            if (currentPlayer) {
                setPlayerDisconnected(namespace, currentPlayer.address);
                // Clean up broadcast tracking
                lastBroadcastMap.delete(currentPlayer.address);
                namespace.emit('players:state', getConnectedPlayers(namespace));
            }
        });

        // Handle socket reconnection
        socket.on('reconnect', () => {
            console.log(`Socket reconnected: ${socket.id}`);
            const currentPlayer = getPlayerBySocket(namespace, socket.id);
            if (currentPlayer) {
                setPlayerConnected(namespace, currentPlayer.address, socket.id);
                // Reset broadcast tracking
                lastBroadcastMap.delete(currentPlayer.address);
                namespace.emit('players:state', getConnectedPlayers(namespace));
            }
        });
    }
};
