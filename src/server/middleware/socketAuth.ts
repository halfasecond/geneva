import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;  // Wallet address from token
    iat: number;     // Issued at timestamp
}

/**
 * Socket.IO middleware for JWT authentication
 */
export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication token missing'));
    }

    try {
        // Verify token using same secret as API
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        
        // Attach user data to socket for later use
        socket.data.userId = decoded.userId;
        socket.data.authenticated = true;

        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Invalid authentication token'));
    }
};