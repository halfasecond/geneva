import { Socket, Namespace } from 'socket.io';

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
    isRacing: boolean;
}

// Helper functions for player state management
export const addPlayer = (namespace: Namespace, player: LivePlayer): LivePlayer => {
    // Only add if player doesn't exist
    const existingPlayer = namespace.players.find(p => p.address === player.address);
    if (!existingPlayer) {
        const newPlayer = { ...player };
        namespace.players.push(newPlayer);
        console.log(`Player added: ${player.address}`);
        console.log('Current players:', namespace.players);
        return newPlayer;
    }
    return existingPlayer;
};

export const updatePlayerPosition = (
    namespace: Namespace,
    address: string,
    x: number,
    y: number,
    direction: 'left' | 'right'
): void => {
    const player = namespace.players.find(p => p.address === address);
    if (player) {
        // Update position
        player.x = x;
        player.y = y;
        player.direction = direction;
        player.lastSeen = new Date();

        // Log position update
        console.log(`Updated position for ${address}:`, { x, y, direction });
        console.log('All players:', namespace.players.map(p => ({
            address: p.address,
            position: { x: p.x, y: p.y, direction: p.direction },
            connected: p.connected
        })));
    } else {
        console.warn(`Attempted to update position for unknown player: ${address}`);
    }
};

export const setPlayerConnected = (namespace: Namespace, address: string, socketId: string): void => {
    const player = namespace.players.find(p => p.address === address);
    if (player) {
        player.connected = true;
        player.socketId = socketId;
        player.lastSeen = new Date();
        console.log(`Player connected: ${address}`);
        console.log('Current players:', namespace.players);
    }
};

export const setPlayerDisconnected = (namespace: Namespace, address: string): void => {
    const player = namespace.players.find(p => p.address === address);
    if (player) {
        player.connected = false;
        player.socketId = null;
        player.lastSeen = new Date();
        console.log(`Player disconnected: ${address}`);
        console.log('Current players:', namespace.players);
    }
};

export const getConnectedPlayers = (namespace: Namespace): LivePlayer[] => {
    const players = namespace.players.filter(p => p.connected);
    console.log(`Getting connected players. Count: ${players.length}`);
    return players;
};

export const getPlayerBySocket = (namespace: Namespace, socketId: string): LivePlayer | undefined => {
    return namespace.players.find(p => p.socketId === socketId);
};

export const getPlayerByAddress = (namespace: Namespace, address: string): LivePlayer | undefined => {
    return namespace.players.find(p => p.address === address);
};

// For testing/development
export const initializeTestPlayer = (namespace: Namespace, socket: Socket): LivePlayer => {
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
    return addPlayer(namespace, testPlayer);
};
