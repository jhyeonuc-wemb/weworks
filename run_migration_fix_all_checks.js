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
        console.log('--- 🚀 Updating we_projects check constraints ---');

        // 1. 현재 등록된 단계 코드들 가져오기
        const phasesRes = await client.query('SELECT DISTINCT code FROM project_phases');
        const phaseCodes = phasesRes.rows.map(r => r.code);

        // 추가 허용 코드들 (임시/레거시 대비)
        const extraCodes = ['tbd', 'sales', 'md_estimation', 'paid_maintenance', 'completed', 'unknown'];
        const finalCodes = [...new Set([...phaseCodes, ...extraCodes])].map(code => `'${code}'`).join(', ');

        // 2. current_phase 제약 조건 업데이트
        await client.query('ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_current_phase_check');
        await client.query(`
            ALTER TABLE we_projects 
            ADD CONSTRAINT we_projects_current_phase_check 
            CHECK (current_phase IN (${finalCodes}))
        `);
        console.log(`✔ we_projects_current_phase_check 업데이트 완료: ${finalCodes}`);

        // 3. process_status 제약 조건 업데이트
        await client.query('ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_process_status_check');
        await client.query(`
            ALTER TABLE we_projects 
            ADD CONSTRAINT we_projects_process_status_check 
            CHECK (process_status IS NULL OR process_status IN (${finalCodes}))
        `);
        console.log(`✔ we_projects_process_status_check 업데이트 완료 (NULL 허용)`);

        await client.query('COMMIT');
        console.log('\n✅ 모든 제약 조건 수정 완료!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ 실패:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
