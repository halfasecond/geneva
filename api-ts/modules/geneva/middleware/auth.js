import jwt from 'jsonwebtoken';

const { JWT_SECRET, HAS_ADMIN } = process.env;
const authenticateToken = (req, res, next) => {
    // Check if the Authorization header is present and in the correct format
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header is missing or not in the correct format' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token is missing' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        const { userId } = decoded;
        const account = HAS_ADMIN.includes(userId);
        if (!account) {
            return res.status(403).json({ error: 'Forbidden: You do not have the required permissions' });
        }
        next();
    });
};


export default authenticateToken;