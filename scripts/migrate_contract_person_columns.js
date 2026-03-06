const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE we_contracts
                ADD COLUMN IF NOT EXISTS orderer_name   VARCHAR(200),
                ADD COLUMN IF NOT EXISTS customer_name  VARCHAR(200),
                ADD COLUMN IF NOT EXISTS manager_name   VARCHAR(200),
                ADD COLUMN IF NOT EXISTS sales_rep_name VARCHAR(200)
        `);
        console.log('Migration OK: person override columns added to we_contracts');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
