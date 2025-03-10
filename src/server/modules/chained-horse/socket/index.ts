import { Position } from '../../../types/actor';
import { upgrades } from '../config/stables'

// Extend the Actor interface to include minimal movement properties
interface Actor {
    id: number;
    type: string;
    position: Position;
    walletAddress?: string;
    socketId?: string;
    connected?: boolean;
    race?: number;
    hay?: number;
    // Add spawn property that matches position structure
    spawn?: Position;
    speed?: number;
}
import { paths, rivers, raceElements, issuesColumns } from './set';
import { initializeScareCityState } from './state/scarecity';

const WORLD_WIDTH = 8000;
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
    addChainface,
    addFlower,
    addTurtle,
    getRandomPosition,
    getWorldState,
    formatActorState,
    completePlayerTutorial,
    getStaticActors,
} from './state/world';
import { Namespace } from 'socket.io';

interface UtilityCount {
    [key: string]: number;
}

interface Models {
    Event: any;
    NFT: any;
    Owner: any;
    Account: any;
    Message: any;
    Race: any;
    ScareCityGame: any;
    [key: string]: any;
}

interface Horse {
    tokenId: number;
    utility: string;
    [key: string]: any;
}

const attributeTypes = [
    'background', 'bodyAccessory', 'bodyColor', 'headAccessory',
    'hoofColor', 'mane', 'maneColor', 'pattern', 'patternColor',
    'tail', 'utility'
]

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

const socket = async (io: any, web3: any, name: string, Models: Models, Contracts: any, emitter: any, db: any) => {
    const namespace = io.of(`/${name}`);
    
    // Apply auth middleware to namespace
    namespace.use(authMiddleware);
    let socketCount = 0;
    let gameLoopInterval: NodeJS.Timeout;
    let saveInterval: NodeJS.Timeout;
    let latestEthBlock = { blocknumber: 0, timestamp: 0 };

    async function processActors() {
        const actors = await Models.GameState.find();
        for (const actor of actors) {
            const bestTime = await Models.Race.findOne({ owner: actor.walletAddress.toLowerCase() }).sort({ time: 1 });
            actor.race = bestTime?.time;
            addPlayer(namespace, '', actor.position as Position, actor.tokenId, actor.walletAddress.toLowerCase(), actor.race, actor.hay)
        }
        return actors
    }
 
    // Initialize world state
    initializeWorldState(namespace, []);
    await processActors()

    // Get initial block number
    const initialBlock = await web3.eth.getBlockNumber();
    latestEthBlock.blocknumber = Number(initialBlock);

    // Log all unique utility traits
    const nfts = await Models.NFT.find({ owner: { $ne: '0x0000000000000000000000000000000000000000' } });

    // Initialize ScareCityGame state with utilities and initial block
    const scareCityState = initializeScareCityState(namespace, nfts, attributeTypes, latestEthBlock.blocknumber, Models);

    // Static Actors - e.g. flowers of goodwill
    const flowers = nfts.filter((horse: Horse) => horse.utility === 'flower of goodwill');

    // Moving actors - e.g. ducks of doom / turtles of speed
    const ducks = nfts.filter((horse: Horse) => horse.utility === 'duck of doom');
    const turtles = nfts.filter((horse: Horse) => horse.utility === 'turtle of speed');
    const chainfaces = await db.collection('cf_nfts').aggregate([{ $sample: { size: 50 } }]).toArray();

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

    console.log(`🦆 Creating ${ducks.length} Ducks of Doom`);
    ducks.forEach((horse: Horse, index: number) => {
        // First 3 ducks in first pond, next 3 in second pond
        let x, y;
        if (index < 3) {
            // First pond
            x = 1140 + (index * 100);
            y = 750 + (Math.random() * 40 - 20); // ±20px random height
        } else {
            // Second pond 
            x = 140 + ((index - 3) * 100);
            y = 2820 + (Math.random() * 40 - 20); // ±20px random height
        }
        addDuck(namespace, x, y, horse.tokenId);
    });
    

    console.log(`🌼 Creating ${flowers.length} Flowers of Goodwill`);
    flowers.forEach((horse: Horse) => {
        const { x, y } = getRandomPosition(RESTRICTED_AREAS, WORLD_WIDTH, WORLD_HEIGHT);
        addFlower(namespace, x, y, horse.tokenId);
    });

    // Initialize first turtle
    if (turtles.length > 0) {
        console.log(`🐢 Creating Turtle of Speed`);
        const { y } = getRandomPosition(RESTRICTED_AREAS, WORLD_WIDTH, WORLD_HEIGHT);
        addTurtle(namespace, -100, y, turtles[0].tokenId);
    }

    console.log(`🔗 Creating ${chainfaces.length} Chainfaces`);
    chainfaces.forEach((cf: any, index: number) => {
        let x, y;
        // First pond
        x = 3250 + (index * 40);
        y = 2100 + (Math.random() * 1000); // ±20px random height
        addChainface(namespace, x, y, cf.face);
    });

    // Define movement behavior configuration for different actor types
    const movementConfig = {
        'duck of doom': {
            speedRange: { min: 0.2, max: 0.4 },
            movementRange: 100,
            speedMultiplier: 0.06
        },
        'turtle of speed': {
            speedRange: { min: 1.0, max: 1.1 },
            movementRange: WORLD_WIDTH + 100,
            speedMultiplier: 1.0
        },
        'chainface': {
            speedRange: { min: 0.5, max: 0.6 },
            movementRange: 100,
            speedMultiplier: 0.06 
        }
    };
    
    // Function to update moving actor position
    const updateMovingActor = (actor: Actor, delta: number) => {
        // Skip if not a moving actor type
        if (!movementConfig[actor.type as keyof typeof movementConfig]) {
            return;
        }
    
        // Initialize movement properties if they don't exist
        if (!actor.spawn) {
            const config = movementConfig[actor.type as keyof typeof movementConfig];
            // Store spawn position for boundary calculations
            actor.spawn = {
                x: actor.position.x,
                y: actor.position.y,
                direction: 'right'
            };
            // Set initial direction
            actor.position.direction = 'right';
            // Set movement speed based on actor type
            actor.speed = config.speedRange.min + (Math.random() * (config.speedRange.max - config.speedRange.min));
        }
    
        const config = movementConfig[actor.type as keyof typeof movementConfig];
        const movementRange = config.movementRange;
        const speed = actor.speed! * (delta * config.speedMultiplier);
    
        // Update position based on current direction
        let newX = actor.position.direction === 'right'
            ? actor.position.x + speed
            : actor.position.x - speed;
    
        // Change direction at boundaries
        if (actor.type === 'turtle of speed') {
            // Special case for turtle which has different boundary logic
            if (newX >= actor.spawn.x + movementRange) {
                newX = actor.spawn.x + movementRange;
                actor.position.direction = 'left';
                const { y } = getRandomPosition(RESTRICTED_AREAS, WORLD_WIDTH, WORLD_HEIGHT)
                actor.position.y = y
            } else if (newX <= actor.spawn.x) {
                newX = actor.spawn.x;
                actor.position.direction = 'right';
                const { y } = getRandomPosition(RESTRICTED_AREAS, WORLD_WIDTH, WORLD_HEIGHT)
                actor.position.y = y
            }
        } else {
            // Standard boundary logic for other actors (like ducks)
            if (newX >= actor.spawn.x + movementRange) {
                newX = actor.spawn.x + movementRange;
                actor.position.direction = 'left';
            } else if (newX <= actor.spawn.x - movementRange) {
                newX = actor.spawn.x - movementRange;
                actor.position.direction = 'right';
            }
        }
        // Update actor position
        actor.position.x = newX;
    };

    // Start game loop
    const startGameLoop = () => {
        let lastTime = Date.now();

        gameLoopInterval = setInterval(() => {
            const now = Date.now();
            const delta = now - lastTime;
            lastTime = now;

            // Update actor positions using the unified function
            namespace.worldState.actors.forEach((actor: Actor) => {
                updateMovingActor(actor, delta);
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
                            hay: player.hay,
                            race: player.race,
                            game: player.game,
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

    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        latestEthBlock.blocknumber = Number(number)
        latestEthBlock.timestamp = Number(timestamp)
        namespace.emit('newEthBlock', latestEthBlock)

        // Update ScareCityGame state
        scareCityState.handleBlockUpdate(latestEthBlock.blocknumber);
    })

    namespace.on('connection', (socket: any) => {
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
                const game = (existingPlayer?.game)
                    ? existingPlayer.game
                    : { level: 0, greaterTractor: null, stable: 0 }

                const player = addPlayer(namespace, socket.id, position, tokenId, walletAddress, existingPlayer?.race, 0, game);
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
            getMessages(namespace, Models.Message)
        });

        socket.on('player:move', async ({ x, y, direction }: Position) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                updateActorPosition(namespace, player.id, x, y, direction);
            }
        });

        socket.on('player:complete_tutorial', (race: any) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                completePlayerTutorial(namespace, player.id, race);
                saveRace(Models, namespace, race, player, 'newbIslandRace');
            }
        });

        socket.on('player:upgrade_stable', async (stable: number) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                const amount = upgrades[stable] as number
                if (player.walletAddress && player.hay && player.hay >= amount && stable > player.game.stable) {
                    player.hay -= amount
                    player.game.stable = stable
                    await new Models.Hay({
                        blockNumber: latestEthBlock.blocknumber,
                        amount,
                        address: player.walletAddress.toLowerCase(),
                        tokenId: player.id,
                        activity: 'stable_upgrade',
                        level: stable
                    }).save();
                    namespace.emit('notification', { tokenId: player.id, type: 'stable_upgrade', stable })
                }
            }
        });

        socket.on('scarecity:scan', ({ scanType, scanResult }: { scanType: string; scanResult: string }) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player && player.walletAddress) {
                scareCityState.handleScan(
                    player.id,
                    player.walletAddress,
                    scanType,
                    scanResult,
                    latestEthBlock.blocknumber
                );
            }
        });

        socket.on('getMessages', () => getMessages(namespace, Models.Message))
        socket.on('getAccounts', () => getAccounts(socket, Models.Account))
        socket.on('addMessage', (message: string) => {
            const player = getPlayerBySocket(namespace, socket.id)
            if (player && player.walletAddress ) {
                let _Message = new Models.Message({ message, account: player.walletAddress })
                _Message.save().then(() => {
                    getMessages(namespace, Models.Message)
                })
            }
        })

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
        
        // No need to clear movement states as they're now part of the actors

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

const saveRace = async (Models: Models, namespace: any, riders: any, player: Actor, name: string) => {
    const _winner = riders.sort((a: any, b: any) => a.time - b.time)[0]
    const winner = _winner.tokenId === player.id
    const owner = player.walletAddress?.toLowerCase();
    const time = _winner.time
    const _race = {
        race: name, tokenId: player.id, winner, owner, time, riders
    }
    await new Models.Race(_race).save();
    const isNotRecord = await Models.Race.findOne({ race: name, time: { $lt: time } })
    if (winner) {
        namespace.emit('notification', { tokenId: player.id, type: name, time, record: !(isNotRecord) })
    }
}

const getAccounts = (socket: any, Model: any) => {
    Model.find({})
        .then((data: any) => socket.emit('accounts', data))
        .catch((err: Error) => console.log(err))
}

const getMessages = (namespace: Namespace, Model: any) => {
    const players = getConnectedPlayers(namespace)
    Model.find({}, {  "_id": 0 }).then((data: any[]) => {
        const messages = [] as any[]
        data.forEach((d: { account: string; _doc: any }) => {
            const avatar = players.find(({ walletAddress }) => walletAddress?.toLowerCase() === d.account.toLowerCase())?.id
            const message = { ...d._doc, avatar }
            messages.push(message)
        })
        namespace.emit('messages', messages)
    }).catch((err: Error) => console.log(err))
}

export default socket;
