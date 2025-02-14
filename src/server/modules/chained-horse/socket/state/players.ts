import { Socket } from 'socket.io';

export interface LivePlayer {
    // Identity
    address: string;
    socketId: string | null;
    
    // Connection State
    connected: boolean;
    lastSeen: Date;
    
    // Game State
    avatarHorseId: number;
    x: number;
    y: number;
    direction: 'left' | 'right';
    levelIndex: number;
}

// In-memory players array - never remove players, only update their state
const livePlayers: LivePlayer[] = [];

// Helper functions for player state management
export const addPlayer = (player: LivePlayer): void => {
    // Only add if player doesn't exist
    const existingPlayer = livePlayers.find(p => p.address === player.address);
    if (!existingPlayer) {
        livePlayers.push(player);
    }
};

export const updatePlayerPosition = (
    address: string,
    x: number,
    y: number,
    direction: 'left' | 'right'
): void => {
    const player = livePlayers.find(p => p.address === address);
    if (player) {
        player.x = x;
        player.y = y;
        player.direction = direction;
        player.lastSeen = new Date();
    }
};

export const setPlayerConnected = (address: string, socketId: string): void => {
    const player = livePlayers.find(p => p.address === address);
    if (player) {
        player.connected = true;
        player.socketId = socketId;
        player.lastSeen = new Date();
    }
};

export const setPlayerDisconnected = (address: string): void => {
    const player = livePlayers.find(p => p.address === address);
    if (player) {
        player.connected = false;
        player.socketId = null;
        player.lastSeen = new Date();
    }
};

export const getConnectedPlayers = (): LivePlayer[] => {
    return livePlayers.filter(p => p.connected);
};

export const getPlayerBySocket = (socketId: string): LivePlayer | undefined => {
    return livePlayers.find(p => p.socketId === socketId);
};

export const getPlayerByAddress = (address: string): LivePlayer | undefined => {
    return livePlayers.find(p => p.address === address);
};

// For testing/development
export const initializeTestPlayer = (socket: Socket): void => {
    const testPlayer: LivePlayer = {
        address: "0x51Ad709f827C6eC2Ed07269573abF592F83ED50c",
        socketId: socket.id,
        connected: true,
        lastSeen: new Date(),
        avatarHorseId: 21,
        x: 100,
        y: 150,
        direction: 'right',
        levelIndex: 0
    };
    addPlayer(testPlayer);
};