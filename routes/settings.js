const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/rbac');
const { logAudit } = require('../services/audit');

// Apply auth & RBAC middleware to all settings routes
router.use(authenticateToken);
router.use(requireRoles(['Super Admin', 'Admin']));

// ==========================================
// KEYWORDS & LOGIC
// ==========================================

// Get all keywords with their logics
router.get('/keywords', async (req, res) => {
    try {
        const [keywords] = await db.execute('SELECT * FROM keywords ORDER BY created_at DESC');
        const [logics] = await db.execute('SELECT * FROM keyword_logics');
        
        // Group logics by keyword_id
        const logicMap = {};
        logics.forEach(l => {
            if (!logicMap[l.keyword_id]) logicMap[l.keyword_id] = [];
            logicMap[l.keyword_id].push(l);
        });

        const result = keywords.map(k => ({
            ...k,
            logics: logicMap[k.id] || []
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching keywords:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create keyword
router.post('/keywords', async (req, res) => {
    try {
        const { text, synonyms } = req.body;
        if (!text) return res.status(400).json({ error: 'Keyword text is required' });

        const synonymsJson = synonyms ? JSON.stringify(synonyms) : null;
        
        const [result] = await db.execute(
            'INSERT INTO keywords (text, synonyms) VALUES (?, ?)',
            [text, synonymsJson]
        );

        await logAudit(req.user.id, 'CREATE_KEYWORD', 'KEYWORD', result.insertId, { text, synonyms });
        res.status(201).json({ id: result.insertId, text, synonyms });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Keyword already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete keyword
router.delete('/keywords/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM keywords WHERE id = ?', [req.params.id]);
        await logAudit(req.user.id, 'DELETE_KEYWORD', 'KEYWORD', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add logic to keyword
router.post('/keywords/:id/logics', async (req, res) => {
    try {
        const { criteria } = req.body;
        if (!criteria) return res.status(400).json({ error: 'Criteria is required' });

        const [result] = await db.execute(
            'INSERT INTO keyword_logics (keyword_id, criteria) VALUES (?, ?)',
            [req.params.id, criteria]
        );

        await logAudit(req.user.id, 'ADD_LOGIC', 'KEYWORD_LOGIC', result.insertId, { keyword_id: req.params.id, criteria });
        res.status(201).json({ id: result.insertId, keyword_id: req.params.id, criteria });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete logic
router.delete('/logics/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM keyword_logics WHERE id = ?', [req.params.id]);
        await logAudit(req.user.id, 'DELETE_LOGIC', 'KEYWORD_LOGIC', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ==========================================
// CLUSTERS
// ==========================================

router.get('/clusters', async (req, res) => {
    try {
        const [clusters] = await db.execute('SELECT * FROM keyword_clusters ORDER BY created_at DESC');
        res.json(clusters);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/clusters', async (req, res) => {
    try {
        const { name, keyword_ids } = req.body;
        if (!name) return res.status(400).json({ error: 'Cluster name is required' });

        const [result] = await db.execute(
            'INSERT INTO keyword_clusters (name, keyword_ids) VALUES (?, ?)',
            [name, JSON.stringify(keyword_ids || [])]
        );

        await logAudit(req.user.id, 'CREATE_CLUSTER', 'CLUSTER', result.insertId, { name });
        res.status(201).json({ id: result.insertId, name, keyword_ids });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Cluster name already exists' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clusters/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM keyword_clusters WHERE id = ?', [req.params.id]);
        await logAudit(req.user.id, 'DELETE_CLUSTER', 'CLUSTER', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ==========================================
// SOURCE REGISTRY
// ==========================================

router.get('/sources', async (req, res) => {
    try {
        const [sources] = await db.execute('SELECT * FROM sources ORDER BY created_at DESC');
        res.json(sources);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/sources', async (req, res) => {
    try {
        const { source_id, source_type, name, configuration } = req.body;
        if (!source_id || !source_type || !name) {
            return res.status(400).json({ error: 'source_id, source_type, and name are required' });
        }

        const validTypes = ['epaper', 'portal', 'social_x', 'social_instagram', 'social_meta', 'social_linkedin'];
        if (!validTypes.includes(source_type)) {
            return res.status(400).json({ error: 'Invalid source_type' });
        }

        const configJson = configuration ? JSON.stringify(configuration) : null;

        await db.execute(
            'INSERT INTO sources (source_id, source_type, name, configuration) VALUES (?, ?, ?, ?)',
            [source_id, source_type, name, configJson]
        );

        await logAudit(req.user.id, 'REGISTER_SOURCE', 'SOURCE', source_id, { source_type, name });
        res.status(201).json({ source_id, source_type, name, configuration });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Source ID already exists' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/sources/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM sources WHERE source_id = ?', [req.params.id]);
        await logAudit(req.user.id, 'DELETE_SOURCE', 'SOURCE', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
