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
      ALTER TABLE we_projects
        ADD COLUMN IF NOT EXISTS supply_amount BIGINT,
        ADD COLUMN IF NOT EXISTS stamp_duty INTEGER,
        ADD COLUMN IF NOT EXISTS performance_bond_rate NUMERIC(5,2) DEFAULT 10,
        ADD COLUMN IF NOT EXISTS defect_bond_rate NUMERIC(5,2) DEFAULT 2,
        ADD COLUMN IF NOT EXISTS payment_schedule TEXT,
        ADD COLUMN IF NOT EXISTS contract_notes TEXT,
        ADD COLUMN IF NOT EXISTS contract_date DATE
    `);
        console.log('Migration OK: contract columns added');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
