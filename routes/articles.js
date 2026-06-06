const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/articles/filters
router.get('/articles/filters', async (req, res) => {
    try {
        const [keywordsRows] = await db.execute('SELECT text FROM keywords ORDER BY text ASC');
        const [sourcesRows] = await db.execute('SELECT source_id, name, source_type FROM sources ORDER BY name ASC');
        
        const tones = [
            { id: 'anti-national', name: 'भारत विरोधी (Anti-National)' },
            { id: 'national', name: 'राष्ट्र समर्थक (National)' },
            { id: 'neutral', name: 'तटस्थ (Neutral)' },
            { id: 'mixed', name: 'मिश्रित (Mixed)' }
        ];
        
        const sourceTypes = [
            { id: 'epaper', name: 'ई-पेपर (E-Paper)' },
            { id: 'portal', name: 'पोर्टल (Portal)' },
            { id: 'social', name: 'सोशल मीडिया (Social Media)' },
            { id: 'upload', name: 'अपलोड (Upload)' }
        ];

        const sourceTypeMap = {
            'epaper': 'E-Paper',
            'portal': 'Portal',
            'social_x': 'Social X',
            'social_instagram': 'Instagram',
            'social_meta': 'Meta',
            'social_linkedin': 'LinkedIn',
            'social': 'Social Media',
            'upload': 'Upload'
        };

        res.status(200).json({
            keywords: keywordsRows.map(k => k.text),
            sources: sourcesRows.map(s => ({ 
                id: s.source_id, 
                name: `${s.name} (${sourceTypeMap[s.source_type] || s.source_type})` 
            })),
            tones: tones,
            sourceTypes: sourceTypes
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});

// GET /api/articles
router.get('/articles', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        let keywords = [];
        let sources = [];
        let tones = [];
        let sourceTypes = [];

        try {
            if (req.query.keywords) keywords = JSON.parse(req.query.keywords);
            if (req.query.sources) sources = JSON.parse(req.query.sources);
            if (req.query.tones) tones = JSON.parse(req.query.tones);
            if (req.query.sourceTypes) sourceTypes = JSON.parse(req.query.sourceTypes);
        } catch (e) {
            console.error('Error parsing filters:', e);
        }

        let whereClauses = [];
        let queryParams = [];

        if (search) {
            whereClauses.push('a.title LIKE ?');
            queryParams.push(`%${search}%`);
        }

        if (sources && sources.length > 0) {
            const placeholders = sources.map(() => '?').join(',');
            whereClauses.push(`a.source_id IN (${placeholders})`);
            queryParams.push(...sources);
        }
        
        if (sourceTypes && sourceTypes.length > 0) {
            const placeholders = sourceTypes.map(() => '?').join(',');
            whereClauses.push(`a.source_type IN (${placeholders})`);
            queryParams.push(...sourceTypes);
        }

        if (tones && tones.length > 0) {
            const placeholders = tones.map(() => '?').join(',');
            whereClauses.push(`a.narrative_tone IN (${placeholders})`);
            queryParams.push(...tones);
        }

        if (keywords && keywords.length > 0) {
            const kwClauses = keywords.map(() => `JSON_CONTAINS(a.matched_keywords, JSON_QUOTE(?))`);
            whereClauses.push(`(${kwClauses.join(' OR ')})`);
            queryParams.push(...keywords);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) as total FROM articles a ${whereString}`;
        const [countRows] = await db.execute(countQuery, queryParams);
        const total = countRows[0].total;

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
            ${whereString}
            ORDER BY a.ingested_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const [rows] = await db.execute(query, queryParams);
        
        res.status(200).json({
            articles: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
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
