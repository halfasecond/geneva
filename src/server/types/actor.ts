export type ActorType = 'player' | 'duck of doom' | 'flower';

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
    sprite: string,
    direction: 'left' | 'right' = 'right'
): Actor => ({
    id,
    type,
    position: { x, y, direction },
    sprite,
    connected: type === 'player' ? true : undefined,
    lastSeen: type === 'player' ? new Date() : undefined,
    introActive: type === 'player' ? true : undefined
});