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
      SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
      WHERE phase_code = 'contract'
      RETURNING project_id, status
    `);
        console.log(`✅ ${res.rowCount}개 프로젝트 → IN_PROGRESS 로 변경`);
        res.rows.forEach(r => console.log(`  - project_id: ${r.project_id}, status: ${r.status}`));
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(console.error);
