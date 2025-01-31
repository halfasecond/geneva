export interface Position {
    x: number
    y: number
    direction: 'left' | 'right'
}

export interface Player {
    id: string
    position: Position
    avatar: number
    isActive: boolean
    lastUpdate: number
}

export interface GameItem {
    id: string
    type: 'bonsai' | 'ghost' | 'flower' | 'duck' | 'turtle' | 'bonfire'
    position: Position
    properties?: {
        speed?: number
        range?: number
    }
}

export interface GameState {
    players: Map<string, Player>
    items: GameItem[]
    lastUpdate: number
}

export interface NetworkState {
    players: Record<string, Player>
    items: GameItem[]
    lastUpdate: number
}

export enum GameEvents {
    PLAYER_JOIN = 'player:join',
    PLAYER_LEAVE = 'player:leave',
    PLAYER_MOVE = 'player:move',
    ITEM_SPAWN = 'item:spawn',
    ITEM_COLLECT = 'item:collect',
    STATE_UPDATE = 'state:update'
}

export const GAME_CONFIG = {
    PADDOCK_SIZE: 5000,
    MOVEMENT_SPEED: 5,
    SPAWN_INTERVAL: 60000, // 1 minute
    CLEANUP_INTERVAL: 300000 // 5 minutes
} as const
