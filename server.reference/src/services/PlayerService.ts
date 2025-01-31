import { Player, Position, Zone, PlayerUpdate } from '../types/Player'
import { GAME_CONFIG } from '../types/Game'

export class PlayerService {
    private players: Map<string, Player>
    private zones: Map<string, Zone>
    private lastCleanup: number

    constructor() {
        this.players = new Map()
        this.zones = new Map()
        this.lastCleanup = Date.now()
        this.initializeZones()
    }

    private initializeZones() {
        const zoneSize = GAME_CONFIG.ZONE_SIZE
        const paddockSize = GAME_CONFIG.PADDOCK_SIZE
        
        for (let x = 0; x < paddockSize; x += zoneSize) {
            for (let y = 0; y < paddockSize; y += zoneSize) {
                const zoneId = `${x/zoneSize}-${y/zoneSize}`
                this.zones.set(zoneId, {
                    id: zoneId,
                    players: new Set(),
                    bounds: {
                        minX: x,
                        maxX: x + zoneSize,
                        minY: y,
                        maxY: y + zoneSize
                    }
                })
            }
        }
    }

    private getZoneForPosition(position: Position): Zone | undefined {
        const zoneX = Math.floor(position.x / GAME_CONFIG.ZONE_SIZE)
        const zoneY = Math.floor(position.y / GAME_CONFIG.ZONE_SIZE)
        return this.zones.get(`${zoneX}-${zoneY}`)
    }

    private updatePlayerZone(playerId: string, oldZone: Zone | undefined, newZone: Zone) {
        if (oldZone) {
            oldZone.players.delete(playerId)
        }
        newZone.players.add(playerId)
    }

    private validatePosition(position: Position): boolean {
        return position.x >= 0 && 
               position.x <= GAME_CONFIG.PADDOCK_SIZE &&
               position.y >= 0 && 
               position.y <= GAME_CONFIG.PADDOCK_SIZE
    }

    private cleanupInactivePlayers() {
        const now = Date.now()
        if (now - this.lastCleanup < 60000) return // Only cleanup every minute

        for (const [id, player] of this.players) {
            if (!player.isActive && now - player.lastUpdate > 300000) { // 5 minutes inactive
                this.removePlayer(id)
            }
        }
        this.lastCleanup = now
    }

    public addPlayer(id: string, initialPosition: Position): Player {
        const player: Player = {
            id,
            position: initialPosition,
            avatar: -1,
            level: 0,
            hay: 0,
            lastUpdate: Date.now(),
            isActive: true
        }

        this.players.set(id, player)
        const zone = this.getZoneForPosition(initialPosition)
        if (zone) {
            this.updatePlayerZone(id, undefined, zone)
        }

        return player
    }

    public removePlayer(id: string) {
        const player = this.players.get(id)
        if (player) {
            const zone = this.getZoneForPosition(player.position)
            if (zone) {
                zone.players.delete(id)
            }
            this.players.delete(id)
        }
    }

    public updatePlayerPosition(update: PlayerUpdate): boolean {
        const player = this.players.get(update.id)
        if (!player) return false

        if (!this.validatePosition(update.position)) return false

        const oldZone = this.getZoneForPosition(player.position)
        const newZone = this.getZoneForPosition(update.position)

        if (newZone && newZone.players.size >= GAME_CONFIG.MAX_PLAYERS_PER_ZONE) {
            return false
        }

        player.position = update.position
        player.lastUpdate = update.timestamp
        
        if (oldZone !== newZone && newZone) {
            this.updatePlayerZone(update.id, oldZone, newZone)
        }

        return true
    }

    public getPlayersByZone(zoneId: string): Player[] {
        const zone = this.zones.get(zoneId)
        if (!zone) return []

        return Array.from(zone.players)
            .map(id => this.players.get(id))
            .filter((player): player is Player => player !== undefined)
    }

    public getNearbyPlayers(playerId: string): Player[] {
        const player = this.players.get(playerId)
        if (!player) return []

        const currentZone = this.getZoneForPosition(player.position)
        if (!currentZone) return []

        // Get players from current and adjacent zones
        const zoneX = parseInt(currentZone.id.split('-')[0])
        const zoneY = parseInt(currentZone.id.split('-')[1])
        const nearbyPlayers = new Set<Player>()

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const adjacentZone = this.zones.get(`${zoneX + x}-${zoneY + y}`)
                if (adjacentZone) {
                    this.getPlayersByZone(adjacentZone.id).forEach(p => nearbyPlayers.add(p))
                }
            }
        }

        return Array.from(nearbyPlayers)
    }

    public getPlayer(id: string): Player | undefined {
        return this.players.get(id)
    }

    public setPlayerActive(id: string, active: boolean) {
        const player = this.players.get(id)
        if (player) {
            player.isActive = active
            player.lastUpdate = Date.now()
        }
    }
}
