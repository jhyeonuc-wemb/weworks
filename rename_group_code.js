const { Pool } = require('pg');
const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

(async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 기존 체크 제약 제거
        await client.query("ALTER TABLE project_phases DROP CONSTRAINT IF EXISTS project_phases_phase_group_check");
        console.log('체크 제약 제거 완료');

        // 2. project_phase_groups 코드 변경
        const r1 = await client.query("UPDATE project_phase_groups SET code = 'sales' WHERE code = 'sales_ps'");
        console.log('project_phase_groups updated:', r1.rowCount);

        // 3. project_phases phase_group 변경
        const r2 = await client.query("UPDATE project_phases SET phase_group = 'sales' WHERE phase_group = 'sales_ps'");
        console.log('project_phases updated:', r2.rowCount);

        // 4. 새 체크 제약 추가
        await client.query(`ALTER TABLE project_phases ADD CONSTRAINT project_phases_phase_group_check CHECK (phase_group::text = ANY(ARRAY['sales','project','maintenance','closure']::text[]))`);
        console.log('새 체크 제약 추가 완료');

        await client.query('COMMIT');
        console.log('Done!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
