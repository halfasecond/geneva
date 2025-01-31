export type TraitType = 
    | 'background'
    | 'bodyAccessory'
    | 'bodyColor'
    | 'headAccessory'
    | 'hoofColor'
    | 'mane'
    | 'maneColor'
    | 'pattern'
    | 'patternColor'
    | 'tail'
    | 'utility'

export type HorseTraits = {
    [K in TraitType]: string
}

export interface Horse {
    tokenId: number
    owner: string
    traits: HorseTraits
    birthBlock: number
    raceStats?: {
        wins: number
        bestTimes: {
            [raceName: string]: number  // Time in milliseconds
        }
    }
}

export interface HorseMetadata {
    name: string
    description: string
    image: string
    attributes: {
        trait_type: TraitType
        value: string
    }[]
}

// Contract events
export enum HorseEvents {
    TRANSFER = 'horse:transfer',
    RACE_WIN = 'horse:race_win',
    TRAIT_UPDATE = 'horse:trait_update'
}

// Race types
export interface RaceResult {
    raceId: string
    tokenId: number
    winner: string
    time: number
    timestamp: number
    blockNumber: number
    isRecord: boolean
}

export interface RaceLeaderboard {
    raceId: string
    records: RaceResult[]
}
