import { Player, GameItem, Position } from '../types'

// Mock players with different positions and avatars
export const mockPlayers: Record<string, Player> = {
    "0x123": {
        id: "0x123",
        position: { x: 200, y: 200, direction: 'right' },
        avatar: 21,
        isActive: true,
        lastUpdate: Date.now()
    },
    "0x456": {
        id: "0x456",
        position: { x: 500, y: 300, direction: 'left' },
        avatar: 30,
        isActive: true,
        lastUpdate: Date.now()
    },
    "0x789": {
        id: "0x789",
        position: { x: 1500, y: 1500, direction: 'right' },
        avatar: 76,
        isActive: true,
        lastUpdate: Date.now()
    }
}

// Helper function to create item positions
const createPosition = (x: number, y: number, direction: Position['direction'] = 'right'): Position => ({
    x, y, direction
})

// Mock game items spread across the paddock
export const mockItems: GameItem[] = [
    {
        id: 'ghost_1',
        type: 'ghost',
        position: createPosition(4000, 50, 'left'),
        properties: { speed: 10 }
    },
    {
        id: 'duck_1',
        type: 'duck',
        position: createPosition(100, 2600),
        properties: { speed: 4 }
    },
    {
        id: 'bonsai_1',
        type: 'bonsai',
        position: createPosition(2500, 2500)
    },
    {
        id: 'flower_1',
        type: 'flower',
        position: createPosition(1200, 800)
    },
    {
        id: 'turtle_1',
        type: 'turtle',
        position: createPosition(3000, 1500),
        properties: { speed: 2 }
    },
    {
        id: 'bonfire_1',
        type: 'bonfire',
        position: createPosition(500, 4500)
    }
]

// Initial game state
export const createInitialState = () => ({
    players: new Map(Object.entries(mockPlayers)),
    items: [...mockItems],
    lastUpdate: Date.now()
})
