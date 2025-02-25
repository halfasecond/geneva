import { Server, Socket } from 'socket.io';
import { GameWorldState } from './state/world';
import { ScareCityState, TraitType } from './state/scarecity';
import { BlockData, MoveData, NotificationData, ScanData, SocketData } from '../../../../types/socket';
import { Position } from '../../../../types/actor';

export const createSocketHandler = (namespace: Server) => {
    const worldState = new GameWorldState();
    const scareCityState = new ScareCityState();
    let latestEthBlock = { blocknumber: 0, timestamp: 0 };

    // Handle block updates
    const emitter = namespace.of('/').adapter;
    emitter.on('newEthBlock', ({ number, timestamp }: BlockData) => {
        latestEthBlock.blocknumber = Number(number);
        latestEthBlock.timestamp = Number(timestamp);
        namespace.emit('newEthBlock', latestEthBlock);

        // Update ScareCityGame state
        scareCityState.handleBlockUpdate(latestEthBlock.blocknumber);
    });

    // Handle socket connections
    namespace.on('connection', (socket: Socket<SocketData>) => {
        // Initial state sync
        socket.emit('newEthBlock', latestEthBlock);
        socket.emit('gameState', scareCityState.getState());
        socket.emit('gameAttributes', scareCityState.getAttributes());

        // Handle player movement
        socket.on('move', ({ position, account }: MoveData) => {
            worldState.updatePlayerPosition(account, position);
            namespace.emit('worldState', worldState.getState());
        });

        // Handle trait scanning
        socket.on('scanTrait', ({ account, scanType, scanResult }: ScanData) => {
            scareCityState.handleScan(
                account,
                scanType,
                scanResult,
                latestEthBlock.blocknumber
            );
        });

        // Forward state updates to clients
        scareCityState.on('gameUpdated', (state) => {
            namespace.emit('gameState', state);
        });

        scareCityState.on('traitFound', (data: { account: string; scanType: TraitType; scanResult: string }) => {
            const notification: NotificationData = {
                account: data.account,
                type: 'Scare City',
                message: `Found ${data.scanResult} ${data.scanType}!`,
                alertAll: true
            };
            namespace.emit('notification', notification);
        });

        scareCityState.on('becameGhost', (data: { account: string }) => {
            const notification: NotificationData = {
                account: data.account,
                type: 'Scare City',
                message: 'Became a ghost!',
                alertAll: true
            };
            namespace.emit('notification', notification);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Handle cleanup if needed
        });
    });

    return {
        worldState,
        scareCityState
    };
};
