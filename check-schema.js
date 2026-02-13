const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'we_users'");
        console.log("Columns in we_users:");
        console.log(res.rows.map(r => r.column_name).join(', '));
        await pool.end();
    } catch (e) {
        console.error(e);
        await pool.end();
    }
}

checkSchema();
