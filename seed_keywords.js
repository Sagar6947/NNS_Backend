const db = require('./db');

async function seed() {
    try {
        console.log("Adding Keywords...");
        
        // Keyword 1
        const [kw1] = await db.execute(
            'INSERT INTO keywords (text, synonyms) VALUES (?, ?)',
            ['Adivasi-Moolnivasi', JSON.stringify(["Tribal displacement", "Indigenous rights", "Forest rights"])]
        );
        
        await db.execute(
            'INSERT INTO keyword_logics (keyword_id, criteria) VALUES (?, ?)',
            [kw1.insertId, "If the article claims that the government is stealing land from tribals to give to corporations, tag as anti-national."]
        );
        await db.execute(
            'INSERT INTO keyword_logics (keyword_id, criteria) VALUES (?, ?)',
            [kw1.insertId, "If the article discusses tribal welfare schemes positively, tag as national."]
        );

        // Keyword 2
        const [kw2] = await db.execute(
            'INSERT INTO keywords (text, synonyms) VALUES (?, ?)',
            ['Economy collapse', JSON.stringify(["economic crisis", "recession", "unemployment", "inflation"])]
        );

        await db.execute(
            'INSERT INTO keyword_logics (keyword_id, criteria) VALUES (?, ?)',
            [kw2.insertId, "If the article claims India's economy is worse than neighboring hostile countries without evidence, tag as anti-national."]
        );

        console.log("Successfully seeded keywords and logics!");

    } catch (e) {
        console.error("Seed error:", e);
    } finally {
        process.exit(0);
    }
}

seed();
