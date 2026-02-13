const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function addColumns() {
    const queries = [
        "ALTER TABLE we_users ADD COLUMN IF NOT EXISTS address TEXT",
        "ALTER TABLE we_users ADD COLUMN IF NOT EXISTS address_detail TEXT",
        "ALTER TABLE we_users ADD COLUMN IF NOT EXISTS joined_date DATE"
    ];

    for (const q of queries) {
        try {
            await pool.query(q);
            console.log(`Success: ${q}`);
        } catch (e) {
            console.error(`Failed: ${q}`, e.message);
        }
    }
    await pool.end();
}

addColumns();
