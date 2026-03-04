const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Connected. Running migration...');
        await client.query(`
            ALTER TABLE we_projects
                ADD COLUMN IF NOT EXISTS maintenance_free_code VARCHAR(50),
                ADD COLUMN IF NOT EXISTS maintenance_paid_code VARCHAR(50)
        `);
        console.log('✅ Columns added: maintenance_free_code, maintenance_paid_code');

        // 확인
        const result = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'we_projects'
              AND column_name IN ('maintenance_free_code', 'maintenance_paid_code')
        `);
        result.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
