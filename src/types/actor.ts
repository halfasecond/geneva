export interface Position {
    x: number;
    y: number;
    direction?: 'left' | 'right';
}

export interface Actor {
    id: number;
    type: 'player' | 'npc';
    position: Position;
    race?: number;
    walletAddress?: string;
}

export interface WorldState {
    actors: Actor[];
    staticActors: Actor[];
}