import { Server, Socket, Namespace } from 'socket.io';
import { Model } from 'mongoose';
import { Position } from '../../../types/actor';
import {
    initializeWorldState,
    addPlayer,
    updateActorPosition,
    setPlayerConnected,
    setPlayerDisconnected,
    getConnectedPlayers,
    getPlayerBySocket,
    addDuck,
    getWorldState,
    formatActorState,
    completePlayerTutorial
} from './state/world';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

const TICK_RATE = 50; // 20 updates per second

const socket = async (io: Server, web3: any, name: string, Models: Models) => {
    const namespace: Namespace = io.of(`/api/${name}`);
    let socketCount = 0;
    let gameLoopInterval: NodeJS.Timeout;

    // Initialize world state
    initializeWorldState(namespace);

    // Log all unique utility traits
    const horses = await Models.NFT.find();
    console.log('\n=== Horse Utility Traits ===');
    const utilities = new Set(horses.map(horse => horse.utility).filter(Boolean));
    console.log('Unique utilities:', Array.from(utilities));
    
    // Log distribution
    const utilityCount = {};
    horses.forEach(horse => {
        if (horse.utility) {
            utilityCount[horse.utility] = (utilityCount[horse.utility] || 0) + 1;
        }
    });
    console.log('\nUtility Distribution:');
    Object.entries(utilityCount).forEach(([utility, count]) => {
        console.log(`${utility}: ${count} horses`);
    });
    // Create ducks of doom
    const duckHorses = horses.filter(horse => horse.utility === 'duck of doom');
    console.log('\nCreating Ducks of Doom:');
    duckHorses.forEach((horse, index) => {
        console.log(`Creating Duck of Doom for Horse #${horse.tokenId}`);
        // Space them out in the first pond
        const x = 1040 + (index * 100);
        addDuck(namespace, x, 650, String(horse.tokenId));
    });

    // Start game loop
    const startGameLoop = () => {
        gameLoopInterval = setInterval(() => {
            // Only broadcast if there are actors
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

    namespace.on('connection', (socket: Socket) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id} (Total sockets: ${socketCount})`);

        // Set up event handlers
        socket.on('player:join', ({ address, horseId }: {
            address: string;
            horseId: number;
        }) => {
            // Default spawn position for new players
            const spawnPosition = { x: 100, y: 150, direction: 'right' as const };
            const player = addPlayer(namespace, address, socket.id, spawnPosition, horseId);
            setPlayerConnected(namespace, player.id, socket.id);
            
            // Send join confirmation and initial state
            socket.emit('player:joined');
            namespace.emit('world:state', getWorldState(namespace));  // Broadcast to all clients
        });

        socket.on('player:move', ({ x, y, direction }: Position) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                updateActorPosition(namespace, player.id, x, y, direction);
            }
        });

        socket.on('player:complete_tutorial', () => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                completePlayerTutorial(namespace, player.id);
            }
        });

        socket.on('disconnect', () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                setPlayerDisconnected(namespace, player.id);
            }
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up game server...');
        
        // Stop the game loop
        stopGameLoop();
        
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

export default socket;
