import { TraitType } from './Horse'
import { Position } from './Player'

export interface GameItem {
    id: string
    type: 'bonsai' | 'ghost' | 'flower' | 'duck' | 'turtle' | 'bonfire'
    position: Position
    properties?: {
        speed?: number
        direction?: 'left' | 'right'
        range?: number
    }
}

export interface ScareCityTrait {
    answer: string
    discounted: string[]
    discounters: string[]
    foundBy: string | null
    foundAtBlock: number | null
}

export interface ScareCityGame {
    gameStart: number
    gameLength: number
    ghosts: string[]
    totalPaidOut: number
    traits: {
        [K in TraitType]: ScareCityTrait
    }
}

export interface GameState {
    items: GameItem[]
    players: Map<string, Position>
    scareCityGame: ScareCityGame | null
    lastUpdate: number
}

export interface GameZone {
    id: string
    items: GameItem[]
    bounds: {
        minX: number
        maxX: number
        minY: number
        maxY: number
    }
}

// Game events
export enum GameEvents {
    ITEM_SPAWN = 'game:item_spawn',
    ITEM_COLLECT = 'game:item_collect',
    SCARE_CITY_START = 'game:scare_city_start',
    SCARE_CITY_END = 'game:scare_city_end',
    ZONE_UPDATE = 'game:zone_update'
}

// Game configuration
export const GAME_CONFIG = {
    PADDOCK_SIZE: 5000,
    ZONE_SIZE: 1000,
    MAX_PLAYERS_PER_ZONE: 50,
    ITEM_SPAWN_INTERVAL: 60000, // 1 minute
    SCARE_CITY_INTERVAL: 3600000, // 1 hour
    MOVEMENT_SPEED: 5,
    INTERPOLATION_DELAY: 100 // ms
} as const
