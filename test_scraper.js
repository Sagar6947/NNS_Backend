const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://thewire.in/rights/bengal-bjp-hawker-bulldozer-left-front-cpim-college-street';
    try {
        const response = await axios.get('https://r.jina.ai/' + url, {
            headers: {
                'X-Return-Format': 'markdown'
            }
        });
        
        console.log("Jina response length:", response.data.length);
        console.log("Snippet:", response.data.substring(0, 500));
        
    } catch (e) {
        console.error("Error", e);
    }
}
test();
