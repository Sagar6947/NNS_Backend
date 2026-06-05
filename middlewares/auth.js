const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nns_super_secret_key_123';

/**
 * Middleware to verify JWT token and append user to request
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user; // Contains id, username, role
        next();
    });
}

module.exports = {
    authenticateToken,
    JWT_SECRET
};
