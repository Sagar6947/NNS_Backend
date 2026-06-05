const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { extractTextFromFile } = require('../services/extractionService');
const { processEpaperText } = require('../services/openaiService');

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/upload-epaper', upload.single('file'), async (req, res) => {
    try {
        const { source_id, city_edition } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!source_id) {
             return res.status(400).json({ error: 'source_id is required' });
        }

        console.log(`Processing upload from ${source_id}: ${file.originalname}`);

        // 1. Extract Text
        const rawText = await extractTextFromFile(file.path, file.mimetype);
        console.log(`Extracted ${rawText.length} characters of text.`);

        if (rawText.length === 0) {
            return res.status(400).json({ error: 'Could not extract text from file' });
        }

        // 2. Process with OpenAI
        console.log('Sending text to OpenAI for parsing...');
        const articles = await processEpaperText(rawText);
        console.log(`OpenAI identified ${articles.length} articles.`);

        // 3. Insert into MySQL Database
        for (const article of articles) {
             const query = `
                INSERT INTO articles (
                    article_id, source_type, source_id, title, subtitle, author, 
                    body_text, language, matched_keywords, claims, narrative_tone, 
                    purpose_judgment, beneficiary_tags, status, raw_file_url
                ) VALUES (?, 'epaper', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'classified', ?)
             `;
             
             const values = [
                 article.article_id,
                 source_id,
                 article.title || null,
                 article.subtitle || null,
                 article.author || null,
                 article.body_text || null,
                 article.language || 'hi',
                 JSON.stringify(article.matched_keywords || []),
                 JSON.stringify(article.claims || []),
                 article.narrative_tone || 'neutral',
                 article.purpose_judgment || null,
                 JSON.stringify(article.beneficiary_tags || []),
                 `/uploads/${file.filename}` // Local path for now
             ];

             await db.execute(query, values);
        }

        res.status(200).json({ 
            message: 'E-paper processed successfully', 
            articleCount: articles.length,
            articles 
        });

    } catch (error) {
        console.error('Error in /upload-epaper:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
