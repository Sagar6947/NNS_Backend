const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const queue = require('../worker/queue');

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
        const { source_id, city_edition, source_type = 'epaper', url } = req.body;
        const file = req.file;

        if (!file && !url) {
            return res.status(400).json({ error: 'No file or URL provided' });
        }
        if (!source_id) {
             return res.status(400).json({ error: 'source_id is required' });
        }

        console.log(`Processing upload from ${source_id}: ${file ? file.originalname : url}`);

        // Enqueue the task
        queue.enqueue('process_epaper', {
            filePath: file ? file.path : null,
            mimeType: file ? file.mimetype : null,
            source_id: source_id,
            source_type: source_type,
            originalname: file ? file.originalname : 'URL Extracted',
            filename: file ? file.filename : null,
            url: url || null
        });

        // Immediately return success response
        res.status(202).json({ 
            message: 'File uploaded successfully and queued for background processing.',
            status: 'queued'
        });

    } catch (error) {
        console.error('Error in /upload-epaper:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
