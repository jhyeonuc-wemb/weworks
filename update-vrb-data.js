const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function updateExistingVrbs() {
    console.log('Updating existing COMPLETED VRB reviews...');
    try {
        const res = await pool.query(`
      UPDATE we_project_vrb_reviews 
      SET 
        review_result = 'PROCEED',
        best_external_purchase_base = 'operating_profit',
        best_external_purchase_percent = 0,
        worst_external_purchase_base = 'operating_profit',
        worst_external_purchase_percent = 0
      WHERE status = 'COMPLETED' AND (review_result IS NULL OR review_result = '');
    `);
        console.log(`Update successful: ${res.rowCount} reviews updated.`);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await pool.end();
    }
}

updateExistingVrbs();
