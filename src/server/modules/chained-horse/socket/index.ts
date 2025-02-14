import { Server, Socket, Namespace } from 'socket.io';
import { Model } from 'mongoose';
import { setupPlayerHandlers } from './handlers/player';
import { getConnectedPlayers } from './state/players';

interface Models {
    Event: Model<any>;
    NFT: Model<any>;
    Owner: Model<any>;
    Account: Model<any>;
    Message: Model<any>;
    [key: string]: Model<any>;
}

const socket = async (io: Server, web3: any, name: string, Models: Models) => {
    const namespace: Namespace = io.of(`/api/${name}`);
    let socketCount = 0;

    // Log player state every 10 seconds
    const stateLogInterval = setInterval(() => {
        const players = getConnectedPlayers();
        console.log('\n=== Current Player State ===');
        console.log('Connected Players:', players.length);
        players.forEach(player => {
            console.log(`Player ${player.address}:`, {
                avatarHorse: player.avatarHorseId,
                position: { x: player.x, y: player.y, direction: player.direction },
                connected: player.connected,
                lastSeen: player.lastSeen
            });
        });
        console.log('===========================\n');
    }, 10000);

    namespace.on('connection', (socket: Socket) => {
        socketCount++;
        console.log(`Socket connected: ${socket.id}`);

        // Set up player event handlers
        setupPlayerHandlers(socket, namespace);

        socket.on('disconnect', () => {
            socketCount--;
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    // Clean up on server shutdown
    const cleanup = () => {
        clearInterval(stateLogInterval);
        namespace.disconnectSockets(true);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
};

export default socket;
