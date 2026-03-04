const { query } = require('./lib/db');

async function fix() {
    try {
        console.log('--- Dropping broken monitoring table ---');
        await query('DROP TABLE IF EXISTS we_project_monitoring CASCADE');
        console.log('Table dropped successfully.');
    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        process.exit();
    }
}

fix();
