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

const socket = async (io: Server, web3: any, name: string, Models: Models) => {
    const namespace: Namespace = io.of(`/api/${name}`);
    let socketCount = 0;

    // Initialize namespace state
    namespace.players = [];

    // Log player state every 5 seconds
    const stateLogInterval = setInterval(() => {
        const connectedPlayers = namespace.players.filter(p => p.connected);
        console.log('\n=== Current Player State ===');
        console.log(`Socket Count: ${socketCount}`);
        console.log('Connected Players:', connectedPlayers.length);
        if (connectedPlayers.length > 0) {
            connectedPlayers.forEach(player => {
                console.log(`Player ${player.address}:`, formatPlayerState(player));
            });
        } else {
            console.log('No connected players');
        }
        console.log('===========================\n');
    }, 5000);

    namespace.on('connection', (socket: Socket) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id} (Total sockets: ${socketCount})`);

        // Set up player event handlers
        setupPlayerHandlers(socket, namespace);

        socket.on('disconnect', () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id} (Total sockets: ${socketCount})`);
            
            // Log state immediately after disconnect
            const connectedPlayers = namespace.players.filter(p => p.connected);
            console.log('\n=== Player State After Disconnect ===');
            console.log(`Socket Count: ${socketCount}`);
            console.log('Connected Players:', connectedPlayers.length);
            connectedPlayers.forEach(player => {
                console.log(`Player ${player.address}:`, formatPlayerState(player));
            });
            console.log('===========================\n');
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        console.log('\n🎮 Cleaning up game server...');
        clearInterval(stateLogInterval);
        
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
