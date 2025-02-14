import { Socket, Namespace } from 'socket.io';
import {
    LivePlayer,
    initializeTestPlayer,
    updatePlayerPosition,
    setPlayerDisconnected,
    getPlayerBySocket,
    getConnectedPlayers
} from '../state/players';

interface Position {
    x: number;
    y: number;
    direction: 'left' | 'right';
}

export const setupPlayerHandlers = (socket: Socket, namespace: Namespace) => {
    // Initialize test player on connection
    initializeTestPlayer(socket);
    
    // Broadcast initial state to all clients
    namespace.emit('players:state', getConnectedPlayers());

    // Handle player movement
    socket.on('player:move', ({ x, y, direction }: Position) => {
        const player = getPlayerBySocket(socket.id);
        if (player) {
            updatePlayerPosition(player.address, x, y, direction);
            // Broadcast position update to other players
            socket.broadcast.emit('player:moved', {
                address: player.address,
                x,
                y,
                direction
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const player = getPlayerBySocket(socket.id);
        if (player) {
            setPlayerDisconnected(player.address);
            // Broadcast player disconnection
            namespace.emit('players:state', getConnectedPlayers());
        }
    });

    // Handle client requesting current state
    socket.on('players:get_state', () => {
        socket.emit('players:state', getConnectedPlayers());
    });
};