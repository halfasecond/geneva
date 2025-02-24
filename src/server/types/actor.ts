export type ActorType = 'player' | 'duck of doom' | 'flower of goodwill';

export interface Position {
    x: number;
    y: number;
    direction: 'left' | 'right';
}

export interface Actor {
    id: number;  // Changed from string to number to match NFT tokenIds
    type: ActorType;
    position: Position;
    size?: number;        // for flowers only - random size 100-200
    walletAddress?: string;  // for players only
    connected?: boolean;   // for players only
    lastSeen?: Date;      // for players only
    race?: undefined | number; // for players only
    socketId?: string;
}

export interface WorldState {
    actors: Actor[];
    timestamp: number;
}

// Helper to create consistent actor objects
export interface PlayerActor extends Actor {
    socketId?: string;
    walletAddress: string;  // Required for all players
}

export const createActor = (
    type: ActorType,
    id: number,  // Changed from string to number
    x: number,
    y: number,
    direction: 'left' | 'right' = 'right'
): Actor => ({
    id,
    type,
    position: { x, y, direction },
    connected: type === 'player' ? true : undefined,
    lastSeen: type === 'player' ? new Date() : undefined,
    race: undefined
});