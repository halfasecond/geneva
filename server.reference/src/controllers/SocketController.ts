import { Server, Socket } from 'socket.io'
import { PlayerService } from '../services/PlayerService'
import { GameStateService } from '../services/GameStateService'
import { PlayerEvents } from '../types/Player'
import { GameEvents } from '../types/Game'

export class SocketController {
    private io: Server
    private playerService: PlayerService
    private gameService: GameStateService

    constructor(io: Server) {
        this.io = io
        this.playerService = new PlayerService()
        this.gameService = new GameStateService()

        // Start game loop
        this.gameService.start()

        // Set up game event handlers
        this.setupGameEventHandlers()
    }

    private setupGameEventHandlers() {
        this.gameService.on(GameEvents.ITEM_SPAWN, (item) => {
            this.io.emit(GameEvents.ITEM_SPAWN, item)
        })

        this.gameService.on(GameEvents.ITEM_COLLECT, (item) => {
            this.io.emit(GameEvents.ITEM_COLLECT, item)
        })

        this.gameService.on(GameEvents.SCARE_CITY_START, (game) => {
            this.io.emit(GameEvents.SCARE_CITY_START, game)
        })

        this.gameService.on(GameEvents.SCARE_CITY_END, (results) => {
            this.io.emit(GameEvents.SCARE_CITY_END, results)
        })

        this.gameService.on(GameEvents.ZONE_UPDATE, () => {
            this.broadcastGameState()
        })
    }

    private broadcastGameState() {
        const state = this.gameService.getState()
        this.io.emit('gameState', state)
    }

    public handleConnection(socket: Socket) {
        console.log(`Client connected: ${socket.id}`)

        // Send initial game state
        socket.emit('gameState', this.gameService.getState())

        socket.on(PlayerEvents.JOIN, ({ id, position }) => {
            const player = this.playerService.addPlayer(id, position)
            
            // Join socket to zone room
            const zone = Math.floor(position.x / 1000) + '-' + Math.floor(position.y / 1000)
            socket.join(zone)
            
            // Notify others in nearby zones
            this.io.to(zone).emit(PlayerEvents.JOIN, player)
            
            // Send list of nearby players
            const nearbyPlayers = this.playerService.getNearbyPlayers(id)
            socket.emit('nearbyPlayers', nearbyPlayers)
        })

        socket.on(PlayerEvents.MOVE, (update) => {
            const success = this.playerService.updatePlayerPosition(update)
            if (success) {
                const player = this.playerService.getPlayer(update.id)
                if (player) {
                    // Calculate new zone
                    const newZone = Math.floor(player.position.x / 1000) + '-' + Math.floor(player.position.y / 1000)
                    
                    // If zone changed, update socket rooms
            const currentRooms = Array.from(socket.rooms.values())
            if (!currentRooms.includes(newZone)) {
                // Leave old zones
                currentRooms
                    .filter(room => room !== socket.id)
                    .forEach(room => socket.leave(room))
                
                // Join new zone
                socket.join(newZone)
            }

                    // Broadcast to nearby zones
                    this.io.to(newZone).emit(PlayerEvents.UPDATE, {
                        id: player.id,
                        position: player.position,
                        timestamp: Date.now()
                    })
                }
            }
        })

        socket.on('disconnect', () => {
            const playerId = Array.from(socket.rooms.values())[0] // First room is the socket ID
            if (playerId) {
                this.playerService.setPlayerActive(playerId, false)
                this.io.emit(PlayerEvents.LEAVE, playerId)
            }
        })

        // Game-specific events
        socket.on('collectItem', ({ itemId, playerId }) => {
            const item = this.gameService.collectItem(itemId)
            if (item) {
                const player = this.playerService.getPlayer(playerId)
                if (player) {
                    // Handle item collection effects
                    switch (item.type) {
                        case 'bonsai':
                            player.hay += 10
                            break
                        case 'flower':
                            player.hay += 5
                            break
                        // Add other item effects
                    }
                }
            }
        })

        socket.on('scareCityScan', ({ playerId, traitType, value }) => {
            const game = this.gameService.getScareCityGame()
            if (game && game.traits[traitType]) {
                if (game.traits[traitType].answer === value) {
                    // Handle correct scan
                    this.io.emit('scareCityResult', {
                        playerId,
                        traitType,
                        success: true
                    })
                }
            }
        })
    }

    public shutdown() {
        this.gameService.stop()
        this.io.close()
    }
}
