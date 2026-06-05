const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/rbac');
const { logAudit } = require('../services/audit');

// Apply auth middleware to all report routes
router.use(authenticateToken);
// Only Admin and Super Admin should see aggregate reports
router.use(requireRoles(['Super Admin', 'Admin']));

// GET /api/reports/summary
// Fetches high level metrics over a date range
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        // 1. Total Articles
        const [[{ total_articles }]] = await db.execute(`SELECT COUNT(*) as total_articles FROM articles ${dateFilter}`, params);

        // 2. Tone distribution
        const [tone_distribution] = await db.execute(`
            SELECT narrative_tone, COUNT(*) as count 
            FROM articles 
            ${dateFilter} 
            GROUP BY narrative_tone
        `, params);

        // 3. Source volume
        const [source_volume] = await db.execute(`
            SELECT source_id, COUNT(*) as count 
            FROM articles 
            ${dateFilter} 
            GROUP BY source_id
            ORDER BY count DESC
            LIMIT 5
        `, params);

        // 4. Keyword frequency
        // We will fetch all matched_keywords and aggregate them in Node for simplicity
        const [all_keywords_rows] = await db.execute(`SELECT matched_keywords FROM articles ${dateFilter}`, params);
        
        const keywordFrequency = {};
        all_keywords_rows.forEach(row => {
            try {
                const kws = JSON.parse(row.matched_keywords);
                if (Array.isArray(kws)) {
                    kws.forEach(k => {
                        keywordFrequency[k] = (keywordFrequency[k] || 0) + 1;
                    });
                }
            } catch (e) { /* ignore parse error */ }
        });

        // Convert object to sorted array
        const top_keywords = Object.entries(keywordFrequency)
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 5. Habitual Repeaters (Sources with high anti-national count)
        const [habitual_repeaters] = await db.execute(`
            SELECT source_id, COUNT(*) as anti_national_count 
            FROM articles 
            WHERE narrative_tone = 'anti-national' 
            ${startDate && endDate ? 'AND created_at BETWEEN ? AND ?' : ''}
            GROUP BY source_id
            HAVING anti_national_count > 2
            ORDER BY anti_national_count DESC
        `, params);

        await logAudit(req.user.id, 'VIEW_REPORT', 'REPORT', null, { startDate, endDate });

        res.json({
            total_articles,
            tone_distribution,
            source_volume,
            top_keywords,
            habitual_repeaters
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
