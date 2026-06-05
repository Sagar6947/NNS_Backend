const db = require('./db');
const { logAudit } = require('./services/audit');

async function test() {
    try {
        const source_id = "test_source";
        const source_type = "epaper";
        const name = "Test Source";
        const configJson = null;

        console.log("Attempting to insert source...");
        await db.execute(
            'INSERT INTO sources (source_id, source_type, name, configuration) VALUES (?, ?, ?, ?)',
            [source_id, source_type, name, configJson]
        );
        console.log("Inserted source!");

        console.log("Attempting logAudit...");
        await logAudit(1, 'REGISTER_SOURCE', 'SOURCE', source_id, { source_type, name });
        console.log("Logged audit!");

    } catch (error) {
        console.error("CAUGHT ERROR:", error);
    } finally {
        process.exit(0);
    }
}

test();
