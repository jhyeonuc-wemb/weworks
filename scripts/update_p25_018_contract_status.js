const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            UPDATE we_project_phase_progress
            SET 
                status = 'IN_PROGRESS',
                status_id = 11,
                completed_at = NULL,
                updated_at = NOW()
            WHERE project_id = 12 AND phase_code = 'contract'
            RETURNING *
        `);
        console.log('Updated:', res.rows[0]);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

run();
