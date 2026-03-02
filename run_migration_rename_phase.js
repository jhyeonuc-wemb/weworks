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
        await client.query('BEGIN');

        // 1. project_phases 코드 변경
        await client.query(
            `UPDATE project_phases SET code = 'maintenance', updated_at = CURRENT_TIMESTAMP WHERE code = 'paid_maintenance'`
        );
        console.log('✔ project_phases: paid_maintenance → maintenance');

        // 2. we_project_phase_progress 기존 텍스트 컬럼도 동기화
        const r = await client.query(
            `UPDATE we_project_phase_progress SET phase_code = 'maintenance' WHERE phase_code = 'paid_maintenance'`
        );
        console.log(`✔ we_project_phase_progress.phase_code: ${r.rowCount}행 업데이트`);

        await client.query('COMMIT');
        console.log('✅ 완료!');

        // 결과 확인
        const res = await client.query(`SELECT id, code, name FROM project_phases WHERE id = 10`);
        console.log('변경 결과:', res.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ 실패:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
