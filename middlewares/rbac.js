/**
 * Middleware to enforce Role-Based Access Control
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
function requireRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access denied: User role not found' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied: Requires one of [${allowedRoles.join(', ')}], but user is ${req.user.role}` 
            });
        }

        next();
    };
}

module.exports = {
    requireRoles
};
