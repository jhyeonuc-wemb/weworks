const { query } = require('./lib/db');

async function check() {
    try {
        console.log('--- Checking Project process_status values ---');

        const res = await query(`
            SELECT process_status, count(*) 
            FROM we_projects 
            GROUP BY process_status
            ORDER BY count DESC
        `);

        console.log('STATS:', JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
