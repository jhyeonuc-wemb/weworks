const { query } = require('./lib/db');

async function check() {
    try {
        console.log('--- Checking Project Phases and Statuses ---');

        const res = await query(`
            SELECT current_phase, status, count(*) 
            FROM we_projects 
            GROUP BY current_phase, status
            ORDER BY count DESC
        `);

        console.log('STATS:', JSON.stringify(res.rows, null, 2));

        const sample = await query(`
            SELECT id, project_code, name, current_phase, status 
            FROM we_projects 
            LIMIT 5
        `);
        console.log('SAMPLE:', JSON.stringify(sample.rows, null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
