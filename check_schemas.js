const { query } = require('./lib/db');

async function checkTables() {
    try {
        const tableRes = await query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'we_project_%' AND table_schema = 'public'");
        const tables = tableRes.rows.map(r => r.table_name);
        console.log('Tables found:', tables.join(', '));

        for (const table of tables) {
            const res = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND table_schema = 'public'`);
            console.log(`Table: ${table} | Columns: ${res.rows.map(r => r.column_name).join(', ')}`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

checkTables();
