const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function rollback() {
    console.log('Rolling back external purchase activation for VRB reviews...');
    try {
        const res = await pool.query(`
      UPDATE we_project_vrb_reviews 
      SET 
        best_include_external_purchase = false,
        worst_include_external_purchase = false
      WHERE status = 'COMPLETED'
    `);
        console.log('Rows updated (rolled back):', res.rowCount);
    } catch (err) {
        console.error('Rollback failed:', err);
    } finally {
        await pool.end();
    }
}

rollback();
