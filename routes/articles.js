const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/articles
router.get('/articles', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.article_id,
                a.published_at,
                a.ingested_at,
                a.source_type,
                a.source_id,
                s.name as source_name,
                a.title,
                a.subtitle,
                a.matched_keywords,
                a.narrative_tone,
                a.purpose_judgment,
                a.beneficiary_tags,
                a.claims,
                a.credibility_score,
                a.status
            FROM articles a
            LEFT JOIN sources s ON a.source_id = s.source_id
            ORDER BY a.ingested_at DESC
            LIMIT 100
        `;
        
        const [rows] = await db.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});

// GET /api/articles/:id
router.get('/articles/:id', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.*,
                s.name as source_name
            FROM articles a
            LEFT JOIN sources s ON a.source_id = s.source_id
            WHERE a.article_id = ?
        `;
        
        const [rows] = await db.execute(query, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});

module.exports = router;
