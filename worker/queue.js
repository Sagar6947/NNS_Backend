/**
 * In-memory Async Task Queue
 * Replaces Celery+Redis since Redis is not installed.
 */

class AsyncQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        // Map of task names to their handler functions
        this.handlers = {};
    }

    register(taskName, handler) {
        this.handlers[taskName] = handler;
        console.log(`Registered background task handler for: ${taskName}`);
    }

    async enqueue(taskName, payload) {
        this.queue.push({ taskName, payload });
        console.log(`[Queue] Task ${taskName} enqueued. Queue length: ${this.queue.length}`);
        
        // Trigger processing asynchronously if not already running
        if (!this.isProcessing) {
            // Use setImmediate to let the current event loop finish
            setImmediate(() => this.process());
        }
    }

    async process() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();
        
        try {
            const handler = this.handlers[task.taskName];
            if (!handler) {
                throw new Error(`No handler registered for task: ${task.taskName}`);
            }
            console.log(`[Queue] Processing task ${task.taskName}...`);
            await handler(task.payload);
            console.log(`[Queue] Task ${task.taskName} completed successfully.`);
        } catch (error) {
            console.error(`[Queue] Task ${task.taskName} failed:`, error);
        }

        // Process next item
        setImmediate(() => this.process());
    }
}

// Singleton instance
const queue = new AsyncQueue();

// ==========================================
// BACKGROUND TASK HANDLERS
// ==========================================

const db = require('../db');
const { extractTextFromFile } = require('../services/extractionService');
const { scrapeUrl } = require('../services/scraperService');
const { processEpaperText } = require('../services/openaiService');
const { v4: uuidv4 } = require('uuid');

queue.register('process_epaper', async (payload) => {
    const { filePath, mimeType, source_id, originalname, filename } = payload;
    
    console.log(`[Worker] Started processing task for source ${payload.source_id}`);

    // 1. Extract text (from URL or File)
    let rawText = '';
    if (payload.url) {
        console.log(`[Worker] Scraping URL: ${payload.url}`);
        rawText = await scrapeUrl(payload.url);
    } else {
        console.log(`[Worker] Extracting text from file: ${payload.filePath}`);
        rawText = await extractTextFromFile(payload.filePath, payload.mimeType);
    }

    if (!rawText || rawText.trim() === '') {
        throw new Error('Extracted text is empty. Cannot proceed with AI analysis.');
    }

    // 2. Fetch Master Settings from DB
    console.log(`[Worker] Fetching master keywords and logics...`);
    const [keywords] = await db.execute('SELECT * FROM keywords');
    const [logics] = await db.execute('SELECT * FROM keyword_logics');
    
    const keywordsAndLogics = keywords.map(kw => ({
        keyword: kw.text,
        synonyms: JSON.parse(kw.synonyms || '[]'),
        logics: logics.filter(l => l.keyword_id === kw.id).map(l => l.criteria)
    }));

    // 3. OpenAI Normalization with dynamic settings
    console.log(`[Worker] Sending ${rawText.length} characters to OpenAI for normalization...`);
    const articles = await processEpaperText(rawText, keywordsAndLogics);

    // 4. Save to DB
    for (const article of articles) {
        const articleId = article.article_id || uuidv4();
        
        await db.execute(
            `INSERT INTO articles (
                article_id, source_type, source_id, title, subtitle, author, 
                body_text, language, matched_keywords, claims, narrative_tone, 
                purpose_judgment, beneficiary_tags, status, raw_file_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'classified', ?)`,
            [
                articleId,
                payload.source_type || 'epaper',
                payload.source_id,
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
                payload.url ? payload.url : `/uploads/${filename}`
            ]
        );
    }
    
    console.log(`[Worker] Successfully normalized and saved ${articles.length} articles into the DB.`);
});

module.exports = queue;
