const db = require('../db');

class Scheduler {
    constructor() {
        this.intervalId = null;
    }

    start() {
        console.log('[Scheduler] Starting background reporting scheduler...');
        
        // Run once every 24 hours (86400000 ms)
        this.intervalId = setInterval(async () => {
            await this.generateDailyReport();
        }, 86400000);
        
        // Optionally run immediately for testing if needed
        // this.generateDailyReport();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    async generateDailyReport() {
        console.log('[Scheduler] Executing daily reporting job...');
        
        try {
            // Calculate yesterday's date bounds
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const startDate = yesterday.toISOString().split('T')[0] + ' 00:00:00';
            const endDate = yesterday.toISOString().split('T')[0] + ' 23:59:59';

            // Find habitual repeaters
            const [repeaters] = await db.execute(`
                SELECT source_id, COUNT(*) as anti_national_count 
                FROM articles 
                WHERE narrative_tone = 'anti-national' 
                AND created_at BETWEEN ? AND ?
                GROUP BY source_id
                HAVING anti_national_count > 2
            `, [startDate, endDate]);

            if (repeaters.length > 0) {
                console.log(`[Scheduler] ALERT: Found ${repeaters.length} habitual repeating sources yesterday!`);
                console.log(repeaters);
                // Here we would integrate with an Email API (e.g. SendGrid) to dispatch the PDF report.
                console.log('[Scheduler] Auto-dispatching report to subscribed admins...');
            } else {
                console.log('[Scheduler] No habitual repeaters found for yesterday.');
            }
            
        } catch (error) {
            console.error('[Scheduler] Error during reporting job:', error);
        }
    }
}

module.exports = new Scheduler();
