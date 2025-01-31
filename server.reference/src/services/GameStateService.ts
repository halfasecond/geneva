import { GameState, GameItem, ScareCityGame, GameEvents, GAME_CONFIG } from '../types/Game'
import { TraitType } from '../types/Horse'
import { Position } from '../types/Player'
import { EventEmitter } from 'events'

export class GameStateService extends EventEmitter {
    private state: GameState
    private itemIdCounter: number
    private gameLoopInterval: NodeJS.Timeout | null

    constructor() {
        super()
        this.itemIdCounter = 0
        this.gameLoopInterval = null
        this.state = {
            items: [],
            players: new Map(),
            scareCityGame: null,
            lastUpdate: Date.now()
        }
    }

    public start() {
        if (this.gameLoopInterval) return
        this.gameLoopInterval = setInterval(() => this.gameLoop(), 1000)
    }

    public stop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval)
            this.gameLoopInterval = null
        }
    }

    private gameLoop() {
        const now = Date.now()
        
        // Update moving items
        this.updateItems()

        // Spawn new items periodically
        if (now - this.state.lastUpdate >= GAME_CONFIG.ITEM_SPAWN_INTERVAL) {
            this.spawnRandomItems()
            this.state.lastUpdate = now
        }

        // Handle Scare City game
        if (!this.state.scareCityGame && now % GAME_CONFIG.SCARE_CITY_INTERVAL < 1000) {
            this.startScareCityGame()
        }
    }

    private updateItems() {
        this.state.items = this.state.items.map(item => {
            if (!item.properties?.speed) return item

            let newX = item.position.x
            let newY = item.position.y

            switch(item.type) {
                case 'turtle':
                    newX = (newX + item.properties.speed) % GAME_CONFIG.PADDOCK_SIZE
                    break
                case 'ghost':
                    if (item.position.x <= 2000) {
                        newX = 5000 // Reset to right side
                    } else {
                        newX -= item.properties.speed
                    }
                    break
                case 'duck':
                    newX = ((newX + item.properties.speed - 20) % 260) + 20 // Move in small area
                    break
            }

            return {
                ...item,
                position: { ...item.position, x: newX, y: newY }
            }
        })

        this.emit(GameEvents.ZONE_UPDATE)
    }

    private spawnRandomItems() {
        const itemTypes: GameItem['type'][] = ['bonsai', 'ghost', 'flower', 'duck', 'turtle', 'bonfire']
        const itemCount = Math.floor(Math.random() * 3) + 1 // 1-3 items

        for (let i = 0; i < itemCount; i++) {
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
            this.spawnItem(type)
        }
    }

    private spawnItem(type: GameItem['type']) {
        let position: Position
        let properties = {}

        switch(type) {
            case 'duck':
                position = {
                    x: Math.floor(Math.random() * 300) + 40,
                    y: Math.floor(Math.random() * 300) + 2500,
                    direction: 'right'
                }
                properties = { speed: 4 }
                break
            case 'ghost':
                position = {
                    x: Math.floor(Math.random() * 3001) + 2000,
                    y: Math.floor(Math.random() * 100),
                    direction: 'left'
                }
                properties = { speed: 10 }
                break
            default:
                position = {
                    x: Math.floor(Math.random() * (GAME_CONFIG.PADDOCK_SIZE - 100)),
                    y: Math.floor(Math.random() * (GAME_CONFIG.PADDOCK_SIZE - 100)),
                    direction: 'right'
                }
        }

        const item: GameItem = {
            id: `item_${++this.itemIdCounter}`,
            type,
            position,
            properties
        }

        this.state.items.push(item)
        this.emit(GameEvents.ITEM_SPAWN, item)
    }

    private startScareCityGame() {
        const traitTypes: TraitType[] = [
            'background', 'bodyAccessory', 'bodyColor', 'headAccessory',
            'hoofColor', 'mane', 'maneColor', 'pattern', 'patternColor',
            'tail', 'utility'
        ]

        const traits: { [K in TraitType]: { answer: string } } = {} as any
        traitTypes.forEach(trait => {
            traits[trait] = {
                answer: `random_${trait}_${Math.floor(Math.random() * 100)}`
            }
        })

        this.state.scareCityGame = {
            gameStart: Date.now(),
            gameLength: 100, // blocks
            ghosts: [],
            totalPaidOut: 0,
            traits: traits as any
        }

        this.emit(GameEvents.SCARE_CITY_START, this.state.scareCityGame)
    }

    public collectItem(itemId: string): GameItem | undefined {
        const itemIndex = this.state.items.findIndex(item => item.id === itemId)
        if (itemIndex === -1) return undefined

        const item = this.state.items[itemIndex]
        this.state.items.splice(itemIndex, 1)
        this.emit(GameEvents.ITEM_COLLECT, item)
        return item
    }

    public getState(): GameState {
        return this.state
    }

    public getScareCityGame(): ScareCityGame | null {
        return this.state.scareCityGame
    }
}
