const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234'
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE we_project_settlement 
            ADD COLUMN IF NOT EXISTS actual_prod_rev_own DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_prod_rev_ext DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_rev_own DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_rev_ext DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_prod_cost_own DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_prod_cost_ext DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_cost_own DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_cost_ext DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_mm_own DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_svc_mm_ext DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_expense_general DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS actual_expense_special DECIMAL(15,2) DEFAULT 0
        `);
        console.log("Successfully added columns to we_project_settlement");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
