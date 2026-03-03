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
      ALTER TABLE we_project_product_plan
        ADD COLUMN IF NOT EXISTS contract_cost_price DECIMAL(15, 2) NULL,
        ADD COLUMN IF NOT EXISTS profitability_id INTEGER NULL
    `);
        console.log('Columns added successfully.');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_plan_profitability_id 
      ON we_project_product_plan(profitability_id)
    `);
        console.log('Index created.');

        const result = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'we_project_product_plan' ORDER BY ordinal_position"
        );
        console.log('\nTable columns now:');
        result.rows.forEach(row => console.log('  -', row.column_name, ':', row.data_type));
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
