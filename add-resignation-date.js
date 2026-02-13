const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function addResignationDate() {
    try {
        await pool.query("ALTER TABLE we_users ADD COLUMN IF NOT EXISTS resignation_date DATE");
        console.log("Success: Added resignation_date column");

        // Also check if others are missing just in case
        await pool.query("ALTER TABLE we_users ADD COLUMN IF NOT EXISTS address TEXT");
        await pool.query("ALTER TABLE we_users ADD COLUMN IF NOT EXISTS address_detail TEXT");
        await pool.query("ALTER TABLE we_users ADD COLUMN IF NOT EXISTS joined_date DATE");

        await pool.end();
    } catch (e) {
        console.error("Failed:", e.message);
        await pool.end();
    }
}

addResignationDate();
