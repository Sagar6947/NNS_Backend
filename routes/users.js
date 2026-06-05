const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { logAudit } = require('../services/audit');
const { authenticateToken } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/rbac');

// Apply auth middleware to all user routes
router.use(authenticateToken);

// GET /api/users (Super Admin, Admin only)
router.get('/', requireRoles(['Super Admin', 'Admin']), async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, email, role, is_active, created_at FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users (Create User - Super Admin, Admin only)
router.post('/', requireRoles(['Super Admin', 'Admin']), async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const validRoles = ['Super Admin', 'Admin', 'Content Uploader', 'User'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hash, role]
        );

        await logAudit(req.user.id, 'CREATE_USER', 'USER', result.insertId, { username, role });

        res.status(201).json({ id: result.insertId, username, email, role });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id (Edit User - Super Admin, Admin only)
router.put('/:id', requireRoles(['Super Admin', 'Admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role, is_active } = req.body;

        const updates = [];
        const values = [];

        if (role) {
            updates.push('role = ?');
            values.push(role);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.execute(query, values);

        await logAudit(req.user.id, 'UPDATE_USER', 'USER', userId, { role, is_active });

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
