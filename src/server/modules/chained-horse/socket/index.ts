import { Server, Socket, Namespace } from 'socket.io';
import { Model } from 'mongoose';
import { setupPlayerHandlers } from './handlers/player';
import { LivePlayer } from './state/players';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

// Augment the Namespace type to include our state
declare module 'socket.io' {
    interface Namespace {
        players: LivePlayer[];
    }
}

const formatPlayerState = (player: LivePlayer) => ({
    address: player.address,
    avatarHorse: player.avatarHorseId,
    position: { x: player.x, y: player.y, direction: player.direction },
    connected: player.connected,
    lastSeen: player.lastSeen
});

const TICK_RATE = 50; // 20 updates per second

const socket = async (io: Server, web3: any, name: string, Models: Models) => {
    const namespace: Namespace = io.of(`/api/${name}`);
    let socketCount = 0;
    let gameLoopInterval: NodeJS.Timeout;

    // Initialize namespace state
    namespace.players = [];

    // Start game loop
    const startGameLoop = () => {
        gameLoopInterval = setInterval(() => {
            // Only broadcast if there are connected players
            if (namespace.players.length > 0) {
                namespace.emit('players:state', namespace.players);
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

        // Set up player event handlers
        setupPlayerHandlers(socket, namespace);

        socket.on('disconnect', () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up game server...');
        
        // Stop the game loop
        stopGameLoop();
        
        // Log final state
        const connectedPlayers = namespace.players.filter(p => p.connected);
        console.log('\n=== Final Player State ===');
        console.log(`Socket Count: ${socketCount}`);
        console.log('Connected Players:', connectedPlayers.length);
        connectedPlayers.forEach(player => {
            console.log(`Player ${player.address}:`, formatPlayerState(player));
        });
        console.log('===========================\n');

        namespace.disconnectSockets(true);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
};

export default socket;
