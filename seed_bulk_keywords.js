const db = require('./db');

const keywords = [
"आदिवासी", "मूलनिवासी", "दलित", "बहुजन", "ओबीसी", "पसमांदा", "वनवासी", "जनजाति", "हिंदूराष्ट्र", "सेक्युलर", "संविधान", "लोकतंत्र", "आरक्षण", "सामाजिकन्याय", "उपनिवेशवाद", "डिकॉलोनाइजेशन", "वामपंथ", "दक्षिणपंथ", "जिहाद", "लवजिहाद", "धर्मांतरण", "तुष्टिकरण", "राष्ट्रविरोध", "अस्मिता", "पहचान", "प्रतिरोध", "वंचित", "प्रतिनिधित्व", "विमर्श", "नैरेटिव", "प्रतिकार", "सभ्यतायुद्ध",
"Right Wing", "Indigenous", "Tribal", "Dalit", "Bahujan", "Pasmanda", "Secularism", "Democracy", "Constitution", "Representation", "Identity", "Resistance", "Inclusion", "Exclusion", "Decolonization", "Leftism", "Rightwing", "Conversion", "Appeasement", "Jihad", "Civilizationalism", "Assertion", "Narrative", "Discourse", "Marginalisation", "Victimhood", "Assertionism", "Pluralism", "Resistanceism"
];

async function seed() {
    try {
        console.log(`Adding ${keywords.length} keywords...`);
        let added = 0;
        let skipped = 0;
        
        for (const kw of keywords) {
            try {
                await db.execute(
                    'INSERT INTO keywords (text, synonyms) VALUES (?, ?)',
                    [kw, "[]"]
                );
                added++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    skipped++;
                } else {
                    console.error("Error inserting", kw, err.message);
                }
            }
        }

        console.log(`Successfully added ${added} new keywords. Skipped ${skipped} duplicates.`);

    } catch (e) {
        console.error("Seed error:", e);
    } finally {
        process.exit(0);
    }
}

seed();
