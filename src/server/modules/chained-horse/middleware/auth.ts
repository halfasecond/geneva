import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;    // Wallet address
    iat: number;      // Issued at timestamp
}

interface AuthenticatedSocket extends Socket {
    user: {
        address: string;  // Wallet address from token
    };
}

/**
 * Socket middleware for JWT authentication
 */
export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication token missing'));
        }

        // Verify token using same secret as API
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        
        // Attach user data to socket
        (socket as AuthenticatedSocket).user = {
            address: decoded.userId
        };

        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Invalid authentication token'));
    }
};

/**
 * Type guard to check if socket is authenticated
 */
export const isAuthenticated = (socket: Socket): socket is AuthenticatedSocket => {
    return !!(socket as AuthenticatedSocket).user?.address;
};

/**
 * Get authenticated user's wallet address
 */
export const getWalletAddress = (socket: Socket): string | null => {
    if (!isAuthenticated(socket)) return null;
    return (socket as AuthenticatedSocket).user.address;
};