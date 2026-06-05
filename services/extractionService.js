const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

async function extractTextFromFile(filePath, mimeType) {
    try {
        let text = '';
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (mimeType.startsWith('image/')) {
            const { data: { text: tesseractText } } = await Tesseract.recognize(
                filePath,
                'hin+eng', // Hindi and English
                { logger: m => console.log(m) }
            );
            text = tesseractText;
        } else {
            throw new Error('Unsupported file type');
        }
        return text;
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error;
    }
}

module.exports = { extractTextFromFile };
