import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

export default authenticateToken;
