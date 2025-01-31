export interface Position {
    x: number
    y: number
    direction: 'left' | 'right'
}

export interface Player {
    id: string               // Wallet address
    position: Position
    avatar: number          // Horse token ID
    level: number
    hay: number
    lastUpdate: number      // Timestamp for interpolation
    isActive: boolean       // Online status
}

export interface PlayerUpdate {
    id: string
    position: Position
    timestamp: number
}

export interface Zone {
    id: string
    players: Set<string>    // Player IDs in this zone
    bounds: {
        minX: number
        maxX: number
        minY: number
        maxY: number
    }
}

// Socket events
export enum PlayerEvents {
    MOVE = 'player:move',
    JOIN = 'player:join',
    LEAVE = 'player:leave',
    UPDATE = 'player:update',
    SYNC = 'player:sync'
}
