const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches the HTML from a URL and extracts the meaningful text content.
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} The extracted text
 */
async function scrapeUrl(url) {
    try {
        const response = await axios.get(`https://r.jina.ai/${url}`, {
            headers: {
                'X-Return-Format': 'markdown',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const markdown = response.data;
        if (!markdown || markdown.trim().length < 50) {
             throw new Error('Failed to extract meaningful text from URL');
        }

        return markdown;
    } catch (error) {
        console.error('Scraping error:', error.message);
        throw new Error('Failed to scrape content from URL: ' + error.message);
    }
}

module.exports = {
    scrapeUrl
};
