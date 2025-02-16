export type ActorType = 'player' | 'duck of doom' | 'flower of goodwill';

export interface Position {
    x: number;
    y: number;
    direction: 'left' | 'right';
}

export interface Actor {
    id: string;
    type: ActorType;
    position: Position;
    connected?: boolean;   // for players only
    lastSeen?: Date;      // for players only
    introActive?: true;   // only present during tutorial
    size?: number;        // for flowers only - random size 100-200
}

export interface WorldState {
    actors: Actor[];
    timestamp: number;
}

// Helper to create consistent actor objects
export const createActor = (
    type: ActorType,
    id: string,
    x: number,
    y: number,
    direction: 'left' | 'right' = 'right'
): Actor => ({
    id,
    type,
    position: { x, y, direction },
    connected: type === 'player' ? true : undefined,
    lastSeen: type === 'player' ? new Date() : undefined,
    introActive: type === 'player' ? true : undefined
});