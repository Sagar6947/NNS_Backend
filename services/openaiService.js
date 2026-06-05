const OpenAI = require('openai');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an analyst evaluating an e-paper text against India-context keywords.
Your task is to parse the raw text from an e-paper page, identify distinct articles, and structure them into a JSON array.
For each article, extract or generate the following:
- title: The headline of the article.
- subtitle: The sub-headline (if any).
- author: The author of the article (if mentioned).
- body_text: The full text of the article.
- language: 'hi' (Hindi), 'en' (English), or 'mixed'.
- matched_keywords: Array of keywords found that relate to narrative contexts (e.g. "Adivasi-Moolnivasi", "economic-reform-as-failure").
- narrative_tone: 'national', 'anti-national', 'neutral', or 'mixed'.
- purpose_judgment: 1-2 sentence purpose summary.
- beneficiary_tags: Array of entities benefiting from the narrative (e.g., 'China', 'Left-wing', 'Corporate').
- claims: JSON array of specific claims made in the article with cited sources. Example: [{"claim": "economy slowing down", "cited_source": "World Bank"}]
- divide_creation_score: A score from 0-10 on how much the article creates societal divides.
- evidence_spans: Array of exact quotes from the article that drove your judgment.

Respond ONLY with a valid JSON array of objects representing these articles.
`;

async function processEpaperText(rawText) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Using gpt-4o for speed and accuracy, could be configurable
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Raw e-paper text:\n${rawText}` }
            ],
            response_format: { type: "json_object" } // Using json_object mode requires wrapping in an object, but system prompt says array.
        });

        // To ensure valid JSON, prompt specifically asks for an object containing an 'articles' array
        const messageContent = response.choices[0].message.content;
        let parsedData = JSON.parse(messageContent);
        
        // If it returned an array directly vs an object with an array
        let articlesArray = Array.isArray(parsedData) ? parsedData : (parsedData.articles || Object.values(parsedData)[0]);

        if (!Array.isArray(articlesArray)) {
             articlesArray = [parsedData];
        }

        return articlesArray.map(article => ({
            article_id: uuidv4(),
            ...article
        }));
    } catch (error) {
        console.error('Error processing with OpenAI:', error);
        throw error;
    }
}

const SYSTEM_PROMPT_BASE = `
You are an analyst evaluating an e-paper text against India-context keywords.
Your task is to parse the raw text from an e-paper page, identify distinct articles, and structure them.
Respond with a JSON object containing a single key "articles" which is an array of objects.
For each article object, extract or generate the following:
- title: The headline of the article.
- subtitle: The sub-headline (if any).
- author: The author of the article (if mentioned).
- body_text: The full text of the article.
- language: 'hi' (Hindi), 'en' (English), or 'mixed'.
- matched_keywords: (Array of Strings) First, match the article against the MASTER KEYWORDS provided in the logic rules below. Include any matches. If the article does NOT match any Master Keywords, you MUST extract and provide 3-5 of your own highly relevant thematic keywords instead.
- narrative_tone: 'national', 'anti-national', 'neutral', or 'mixed'.
- purpose_judgment: 1-2 sentence purpose summary.
- beneficiary_tags: Array of entities benefiting from the narrative.
- claims: JSON array of specific claims made in the article with cited sources. 
- divide_creation_score: A score from 0-10 on how much the article creates societal divides.
- evidence_spans: Array of exact quotes from the article that drove your judgment.

CRITICAL INSTRUCTION:
You MUST evaluate the narrative_tone, purpose_judgment, and matched_keywords specifically against the following MASTER KEYWORDS and LOGIC CRITERIA provided by the user:
{DYNAMIC_LOGIC_RULES}

If an article does not match any of these criteria, tone should likely be 'neutral'. If it explicitly matches the rules for a keyword, judge it according to the configured logics.
`;

async function processEpaperTextFixed(rawText, keywordsAndLogics = []) {
    try {
        const dynamicRules = keywordsAndLogics.length > 0 
            ? JSON.stringify(keywordsAndLogics, null, 2)
            : "No specific logic rules provided. Use generic India-context judgment.";

        const prompt = SYSTEM_PROMPT_BASE.replace('{DYNAMIC_LOGIC_RULES}', dynamicRules);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: `Raw e-paper text:\n${rawText}` }
            ],
            response_format: { type: "json_object" } 
        });

        const messageContent = response.choices[0].message.content;
        const parsedData = JSON.parse(messageContent);
        
        let articlesArray = parsedData.articles || [];

        return articlesArray.map(article => ({
            article_id: uuidv4(),
            ...article
        }));
    } catch (error) {
        console.error('Error processing with OpenAI:', error);
        throw error;
    }
}

module.exports = { processEpaperText: processEpaperTextFixed };
