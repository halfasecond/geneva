import { Server, Socket, Namespace } from 'socket.io';
import { Model } from 'mongoose';
import { Actor, Position } from '../../../types/actor';
import { paths, rivers, raceElements, issuesColumns } from './set';

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

import {
    initializeWorldState,
    addPlayer,
    updateActorPosition,
    setPlayerConnected,
    setPlayerDisconnected,
    getConnectedPlayers,
    getPlayerBySocket,
    addDuck,
    addFlower,
    getRandomPosition,
    getWorldState,
    formatActorState,
    completePlayerTutorial,
    getStaticActors
} from './state/world';

interface UtilityCount {
    [key: string]: number;
}

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    Race: Model<any>;
    [key: string]: Model<any>;
}

// Game settings that can be adjusted
const gameSettings = {
    tickRate: 100,  // 100 = 10 updates per second
    movementSpeed: 16,  // pixels per frame
    broadcastFrames: 2,  // Client broadcasts every 5th frame
    smoothing: 0.1,  // Animation smoothing factor
    saveStateInterval: 1000 * 60 // Save state every 1 minute
};

// Slower tick rate for better performance
const TICK_RATE = gameSettings.tickRate;
const SAVE_STATE_INTERVAL = gameSettings.saveStateInterval

import { authMiddleware, getWalletAddress } from '../middleware/auth';

const socket = async (io: Server, web3: any, name: string, Models: Models, Contracts: any, emitter: any) => {
    const namespace: Namespace = io.of(`/${name}`);
    
    // Apply auth middleware to namespace
    namespace.use(authMiddleware);
    let socketCount = 0;
    let gameLoopInterval: NodeJS.Timeout;
    let saveInterval: NodeJS.Timeout;

    async function processActors() {
        const actors = await Models.GameState.find();
        for (const actor of actors) {
            const bestTime = await Models.Race.findOne({ owner: actor.walletAddress.toLowerCase() }).sort({ time: 1 });
            actor.race = bestTime?.time;
            addPlayer(namespace, '', actor.position as Position, actor.tokenId, actor.walletAddress.toLowerCase(), actor.race)
        }
        return actors
    }

    // Initialize world state
    initializeWorldState(namespace, []);
    await processActors()

    // Log all unique utility traits
    const horses = await Models.NFT.find();
    // console.log('\n=== Horse Utility Traits ===');
    // const utilities = new Set(horses.map(horse => horse.utility).filter(Boolean));
    // console.log('Unique utilities:', Array.from(utilities));
    
    // Log distribution
    const utilityCount: UtilityCount = {};
    horses.forEach(horse => {
        if (horse.utility) {
            utilityCount[horse.utility] = (utilityCount[horse.utility] || 0) + 1;
        }
    });
    console.log('\nUtility Distribution:');
    Object.entries(utilityCount).forEach(([utility, count]) => {
        console.log(`${utility}: ${count} horses`);
    });
    // Create ducks of doom and flowers of goodwill
    const duckHorses = horses.filter(horse => horse.utility === 'duck of doom');
    const flowerHorses = horses.filter(horse => horse.utility === 'flower of goodwill');

    // Define all restricted areas for flower placement
    const RESTRICTED_AREAS = [
        // Ponds (500x400 each)
        { left: 1040, top: 510, width: 500, height: 400 },
        { left: 40, top: 2580, width: 500, height: 400 },
        // Rivers
        ...rivers,
        // Bridleway paths (with 20px buffer)
        ...paths.map(path => ({
            left: path.left - 20,
            top: path.top - 20,
            width: path.width + 40,
            height: path.height + 40
        })),
        // Race track elements
        ...raceElements,
        // Issues columns
        ...issuesColumns
    ];

    console.log(`🦆 Creating ${duckHorses.length} Ducks of Doom`);
    duckHorses.forEach((horse, index) => {
        
        // First 3 ducks in first pond, next 3 in second pond
        let x, y;
        if (index < 3) {
            // First pond (1140, 750) - moved right 100px, down 100px
            x = 1140 + (index * 100);
            y = 750 + (Math.random() * 40 - 20); // ±20px random height
        } else {
            // Second pond (140, 2820) - moved right 100px, down 100px
            x = 140 + ((index - 3) * 100);
            y = 2820 + (Math.random() * 40 - 20); // ±20px random height
        }
        
        addDuck(namespace, x, y, horse.tokenId);  // Already a number
    });

    console.log(`🌼 Creating ${flowerHorses.length} Flowers of Goodwill`);
    flowerHorses.forEach(horse => {
        const { x, y } = getRandomPosition(RESTRICTED_AREAS, WORLD_WIDTH, WORLD_HEIGHT);
        addFlower(namespace, x, y, horse.tokenId);  // Already a number
    });

    // Track duck movement state
    const duckState = new Map<string, {
        spawnX: number;
        direction: 'left' | 'right';
        speed: number;
    }>();

    // Start game loop
    const startGameLoop = () => {
        let lastTime = Date.now();

        gameLoopInterval = setInterval(() => {
            const now = Date.now();
            const delta = now - lastTime;
            lastTime = now;

            // Update duck positions
            namespace.worldState.actors.forEach(actor => {
                if (actor.type === 'duck of doom') {
                    // Initialize state if needed
                    if (!duckState.has(actor.id.toString())) {
                        duckState.set(actor.id.toString(), {
                            spawnX: actor.position.x,
                            direction: 'right',
                            speed: 0.2 + (Math.random() * 0.2) // Slower speed range (0.2-0.4)
                        });
                    }

                    const state = duckState.get(actor.id.toString())!;
                    const MOVEMENT_RANGE = 100; // 100px each direction
                    const DUCK_SPEED = state.speed * (delta * 0.06);

                    // Update position
                    let newX = state.direction === 'right'
                        ? actor.position.x + DUCK_SPEED
                        : actor.position.x - DUCK_SPEED;

                    // Change direction at boundaries
                    if (newX >= state.spawnX + MOVEMENT_RANGE) {
                        newX = state.spawnX + MOVEMENT_RANGE;
                        state.direction = 'left';
                    } else if (newX <= state.spawnX - MOVEMENT_RANGE) {
                        newX = state.spawnX - MOVEMENT_RANGE;
                        state.direction = 'right';
                    }

                    // Update actor position
                    actor.position.x = newX;
                    // Direction should be opposite of movement (face left when moving right)
                    actor.position.direction = state.direction === 'right' ? 'left' : 'right';
                }
            });

            // Broadcast if there are actors
            if (namespace.worldState.actors.length > 0) {
                namespace.emit('world:state', getWorldState(namespace));
            }
        }, TICK_RATE);
    };

    // Stop game loop
    const stopGameLoop = () => {
        if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
        }
    };

    // Start game loop when server starts
    startGameLoop();

    const startSaveLoop = () => {
        saveInterval = setInterval(async () => {
            const connectedPlayers = getConnectedPlayers(namespace);
            for (const player of connectedPlayers) {
                await Models.GameState.findOneAndUpdate(
                    { tokenId: player.id, walletAddress: player.walletAddress?.toLowerCase() },
                    {
                        $set: {
                            position: player.position,
                            race: player.race,
                            lastSeen: new Date()
                        }
                    },
                    { upsert: true, new: true }
                );
            }
        }, SAVE_STATE_INTERVAL)
    }

    // Start save loop when server starts
    startSaveLoop();

    const stopSaveLoop = () => {
        if (saveInterval) {
            clearInterval(saveInterval);
        }
    };

    let latestEthBlock = { blocknumber: 0, timestamp: 0 }
    emitter.on('newEthBlock', ({ number, timestamp }) => {
        console.log(number, timestamp)
        latestEthBlock.blocknumber = Number(number)
        latestEthBlock.timestamp = Number(timestamp)
        namespace.emit('newEthBlock', latestEthBlock)
    })

    namespace.on('connection', (socket: Socket) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id} (Total sockets: ${socketCount})`);

        // Set up event handlers
        socket.on('player:join', async ({ tokenId }: {
            tokenId: number;  // NFT token ID
        }) => {
            try {
                const walletAddress = getWalletAddress(socket);
                if (!walletAddress) {
                    socket.emit('error', { message: 'Not authenticated' });
                    return;
                }
                try { // Verify 🐎 ownership...
                    const contract = new web3.eth.Contract(Contracts.Core.abi, Contracts.Core.addr);
                    const owner = await contract.methods.ownerOf(tokenId).call();
                    const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
                    if (!isOwner) {
                        socket.emit('error', { message: 'You do not own this horse' });
                        return;
                    }
                } catch (error) {
                    socket.emit('error', { message: 'Failed to verify horse ownership' });
                    return;
                }

                console.log(`🐎 Horse #${tokenId} joined the paddock 🐎`);
                const existingPlayer = await Models.GameState.findOne({ tokenId, walletAddress: walletAddress.toLowerCase() })
                const position = (existingPlayer?.position && existingPlayer?.race)
                    ? existingPlayer?.position
                    : { x: 100, y: 150, direction: 'right' as const } // Default spawn position for new players and players or haven't finished the race
                const player = addPlayer(namespace, socket.id, position, tokenId, walletAddress, existingPlayer?.race);
                setPlayerConnected(namespace, player.id);
                socket.emit('newEthBlock', latestEthBlock)
                // Save to GameState collection
                await Models.GameState.findOneAndUpdate(
                    { walletAddress: walletAddress.toLowerCase() },
                    {
                        $set: {
                            tokenId,
                            position,
                            connected: true,
                            lastSeen: new Date(),
                            race: undefined
                        }
                    },
                    { upsert: true, new: true }
                );
            } catch (error) {
                console.error('Join error:', error);
                socket.emit('error', { message: 'Failed to join game' });
            }
            
            // Send join confirmation, game settings, static actors, and initial state
            socket.emit('player:joined');
            socket.emit('game:settings', gameSettings);  // Send game settings
            socket.emit('static:actors', getStaticActors(namespace));  // Send static actors once
            namespace.emit('world:state', getWorldState(namespace));  // Broadcast dynamic actors
        });

        socket.on('player:move', async ({ x, y, direction }: Position) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                updateActorPosition(namespace, player.id, x, y, direction);
            }
        });

        socket.on('player:complete_tutorial', race => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                completePlayerTutorial(namespace, player.id, race);
                saveRace(Models, race, player, 'newbIslandRace');
            }
        });

        socket.on('disconnect', async () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                setPlayerDisconnected(namespace, player.id);
                
                // Update GameState collection
                const walletAddress = getWalletAddress(socket);
                if (walletAddress) {
                    await Models.GameState.updateOne(
                        { walletAddress: walletAddress.toLowerCase() },
                        {
                            $set: {
                                connected: false,
                                lastSeen: new Date()
                            }
                        }
                    );
                }
            }
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up game server...');
        
        // Stop the game loop
        stopGameLoop();

        // Stop the save loop
        stopSaveLoop();
        
        // Clear duck movement state
        duckState.clear();

        // Log final state
        const connectedPlayers = getConnectedPlayers(namespace);
        console.log('\n=== Final World State ===');
        console.log(`Socket Count: ${socketCount}`);
        console.log('Connected Players:', connectedPlayers.length);
        console.log('All Actors:', namespace.worldState.actors.length);
        connectedPlayers.forEach(player => {
            console.log(`Player ${player.id}:`, formatActorState(player));
        });
        console.log('===========================\n');

        namespace.disconnectSockets(true);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
};

const saveRace = async (Models: Models, riders: any, player: Actor, name: string) => {
    const _winner = riders.sort((a: any, b: any) => a.time - b.time)[0]
    const winner = _winner.tokenId === player.id
    const owner = player.walletAddress?.toLowerCase();
    const time = _winner.time
    const _race = {
        race: name, tokenId: player.id, winner, owner, time, riders
    }
    await new Models.Race(_race).save();
    const record = await Models.Race.findOne({ race: name, time: { $lt: time } })
    if (record) {
        console.log(`🐎 horse #${_winner.tokenId} just won the ${name} in ${time}`)
    } else {
        console.log(`🐎 horse #${_winner.tokenId} just set a new record in the ${name} with ${time}`)
    }
}

export default socket;
