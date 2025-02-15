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
    formatActorState
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

    // Add initial ducks
    addDuck(namespace, 1040, 650); // First pond
    addDuck(namespace, 1140, 650);
    addDuck(namespace, 1240, 650);
    addDuck(namespace, 40, 2720);  // Second pond
    addDuck(namespace, 140, 2720);
    addDuck(namespace, 240, 2720);

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
            
            // Send join confirmation first
            socket.emit('player:joined');
            
            // Then send initial world state
            socket.emit('world:state', getWorldState(namespace));
        });

        socket.on('player:move', ({ x, y, direction }: Position) => {
            const player = getPlayerBySocket(namespace, socket.id);
            if (player) {
                updateActorPosition(namespace, player.id, x, y, direction);
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
