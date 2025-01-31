import { EventEmitter } from 'events'
import { GameState, Player, GameItem, Position, GameEvents, GAME_CONFIG } from '../types'
import { createInitialState } from '../mock/data'

interface NetworkState {
    players: Record<string, Player>
    items: GameItem[]
    lastUpdate: number
}

export class GameService extends EventEmitter {
    private state: GameState
    private itemIdCounter: number
    private gameLoopInterval: NodeJS.Timeout | null

    constructor() {
        super()
        this.state = createInitialState()
        this.itemIdCounter = this.state.items.length
        this.gameLoopInterval = null
    }

    public start() {
        if (this.gameLoopInterval) return
        this.gameLoopInterval = setInterval(() => this.gameLoop(), 100) // Faster updates for smoother movement
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

        // Clean up inactive players
        this.cleanupInactivePlayers()

        // Spawn new items periodically
        if (now - this.state.lastUpdate >= GAME_CONFIG.SPAWN_INTERVAL) {
            this.spawnRandomItems()
            this.state.lastUpdate = now
        }
    }

    private updateItems() {
        this.state.items = this.state.items.map(item => {
            if (!item.properties?.speed) return item

            let newX = item.position.x
            const newY = item.position.y

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

        // Throttle state updates to reduce network traffic
        if (Date.now() - this.state.lastUpdate > 50) { // 20 updates per second max
            this.emit(GameEvents.STATE_UPDATE, this.getNetworkState())
            this.state.lastUpdate = Date.now()
        }
    }

    private cleanupInactivePlayers() {
        const now = Date.now()
        for (const [id, player] of this.state.players.entries()) {
            if (!player.isActive && now - player.lastUpdate > GAME_CONFIG.CLEANUP_INTERVAL) {
                this.state.players.delete(id)
                this.emit(GameEvents.PLAYER_LEAVE, id)
            }
        }
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

    public addPlayer(id: string, position: Position): Player {
        const player: Player = {
            id,
            position,
            avatar: Math.floor(Math.random() * 100), // Random avatar for testing
            isActive: true,
            lastUpdate: Date.now()
        }

        this.state.players.set(id, player)
        this.emit(GameEvents.PLAYER_JOIN, player)
        return player
    }

    public updatePlayerPosition(id: string, position: Position): boolean {
        const player = this.state.players.get(id)
        if (!player) return false

        // Validate position
        if (position.x < 0 || position.x > GAME_CONFIG.PADDOCK_SIZE ||
            position.y < 0 || position.y > GAME_CONFIG.PADDOCK_SIZE) {
            return false
        }

        player.position = position
        player.lastUpdate = Date.now()
        
        this.emit(GameEvents.PLAYER_MOVE, { id, position })
        return true
    }

    public setPlayerActive(id: string, active: boolean) {
        const player = this.state.players.get(id)
        if (player) {
            player.isActive = active
            player.lastUpdate = Date.now()
        }
    }

    public collectItem(itemId: string): GameItem | undefined {
        const itemIndex = this.state.items.findIndex(item => item.id === itemId)
        if (itemIndex === -1) return undefined

        const item = this.state.items[itemIndex]
        this.state.items.splice(itemIndex, 1)
        this.emit(GameEvents.ITEM_COLLECT, item)
        return item
    }

    private getNetworkState(): NetworkState {
        return {
            players: Object.fromEntries(this.state.players),
            items: this.state.items,
            lastUpdate: this.state.lastUpdate
        }
    }

    public getState(): NetworkState {
        return this.getNetworkState()
    }
}
