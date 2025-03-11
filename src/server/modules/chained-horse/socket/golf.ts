import { Namespace, Socket } from 'socket.io';
import { InterdimensionalGolf } from './state/golf';

// Initialize the golf game
export const initializeGolfGame = (io: any, namespace: Namespace, db: any) => {
    console.log('🏌️‍♂️ Initializing Interdimensional Chainface Golf');
    
    // Create the golf game instance
    const golfGame = new InterdimensionalGolf(namespace, db);
    
    // Handle socket connections
    namespace.on('connection', (socket: Socket) => {
        console.log(`Golf socket connected: ${socket.id}`);
        
        // Handle join event
        socket.on('golf:join', () => {
            console.log(`Player joined golf: ${socket.id}`);
            
            // Send the current state to the client
            socket.emit('golf:state', golfGame.getState());
        });
        
        // Handle golf commands
        socket.on('golf:command', ({ command }: { command: string }) => {
            console.log(`Golf command received: ${command}`);
            golfGame.handleCommand(command);
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Golf socket disconnected: ${socket.id}`);
        });
    });
    
    // Clean up on server shutdown
    const cleanup = () => {
        console.log('🏌️‍♂️ Cleaning up golf game');
        golfGame.stopUpdateLoop();
        namespace.disconnectSockets(true);
    };
    
    // Add cleanup to process events
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    
    return golfGame;
};