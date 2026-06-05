const db = require('../db');

/**
 * Logs an action to the audit_logs table
 * @param {number|null} userId - The ID of the user performing the action (null if system)
 * @param {string} action - The action performed (e.g., 'LOGIN', 'CREATE_USER', 'UPLOAD_EPAPER')
 * @param {string} resourceType - The type of resource affected (e.g., 'USER', 'SOURCE', 'ARTICLE')
 * @param {string|null} resourceId - The ID of the resource affected
 * @param {object|null} details - Additional JSON details about the action
 */
async function logAudit(userId, action, resourceType, resourceId = null, details = null) {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [
            userId,
            action,
            resourceType,
            resourceId,
            details ? JSON.stringify(details) : null
        ];
        
        await db.execute(query, values);
    } catch (error) {
        console.error('Failed to insert audit log:', error);
    }
}

module.exports = {
    logAudit
};
