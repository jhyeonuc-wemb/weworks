const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function migrate() {
    console.log('Starting migration: Add review_result column...');
    try {
        const res = await pool.query(`
      ALTER TABLE we_project_vrb_reviews 
      ADD COLUMN IF NOT EXISTS review_result VARCHAR(20);
    `);
        console.log('Migration successful: review_result column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
