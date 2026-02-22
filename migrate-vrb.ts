import pool from './lib/db';

async function migrate() {
    console.log('Starting migration: Add review_result column...');
    try {
        await pool.query(`
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
