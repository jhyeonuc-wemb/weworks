const { query } = require('./lib/db');

async function check() {
    try {
        console.log('--- Checking Matching Projects ---');

        const res = await query(`
            SELECT id, project_code, name, current_phase, status, created_at
            FROM we_projects 
            WHERE current_phase = 'in_progress' AND status = 'active'
        `);

        console.log('MATCHING:', JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
