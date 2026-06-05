const db = require('./db');

const accounts = [
    { name: "Anand Ranganathan", handle: "@ARanganathan72" },
    { name: "Abhijit Iyer-Mitra", handle: "@Iyervval" },
    { name: "Shefali Vaidya", handle: "@ShefVaidya" },
    { name: "Ajeet Bharti", handle: "@ajeetbharti" },
    { name: "Tushar Gupta", handle: "@Tushar15_" },
    { name: "Friends of RSS", handle: "@friendsofrss" },
    { name: "String Reveals", handle: "@StringReveals" },
    { name: "Jaipur Dialogues", handle: "@JaipurDialogues" },
    { name: "Koenraad Elst", handle: "@ElstKoenraad" },
    { name: "Rana Ayyub", handle: "@RanaAyyub" },
    { name: "Dhruv Rathee", handle: "@dhruv_rathee" },
    { name: "Mohammed Zubair", handle: "@zoo_bear" },
    { name: "Kunal Kamra", handle: "@kunalkamra88" },
    { name: "Abhisar Sharma", handle: "@abhisar_sharma" },
    { name: "Arfa Khanum Sherwani", handle: "@khanumarfa" },
    { name: "Saba Naqvi", handle: "@_sabanaqvi" },
    { name: "Ravish Kumar", handle: "@ravishndtv" },
    { name: "Bhanwar Meghwanshi", handle: "@BhanwarMegh" },
    { name: "Afroz Alam Sahil", handle: "@afrozealam" },
    { name: "Rajdeep Sardesai", handle: "@sardesairajdeep" },
    { name: "Faye D'Souza", handle: "@fayedsouza" },
    { name: "Palki Sharma", handle: "@palkisu" },
    { name: "Shiv Aroor", handle: "@ShivAroor" },
    { name: "Smita Prakash", handle: "@smitaprakash" },
    { name: "Nikhil Kamath", handle: "@nikhilkamathcio" },
    { name: "Akash Banerjee", handle: "@TheDeshBhakt" },
    { name: "Ankit Lal", handle: "@AnkitLal" },
    { name: "Pratik Sinha", handle: "@free_thinker" },
    { name: "Kanchan Gupta", handle: "@KanchanGupta" }
];

async function seed() {
    try {
        console.log(`Adding ${accounts.length} X sources...`);
        let added = 0;
        let skipped = 0;
        
        for (const account of accounts) {
            try {
                // source_id = handle without @
                const source_id = account.handle.replace('@', '');
                await db.execute(
                    'INSERT INTO sources (source_id, source_type, name, configuration) VALUES (?, ?, ?, ?)',
                    [source_id, 'social_x', account.name, JSON.stringify({ handle: account.handle })]
                );
                added++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    skipped++;
                } else {
                    console.error("Error inserting", account.name, err.message);
                }
            }
        }

        console.log(`Successfully added ${added} new X sources. Skipped ${skipped} duplicates.`);

    } catch (e) {
        console.error("Seed error:", e);
    } finally {
        process.exit(0);
    }
}

seed();
