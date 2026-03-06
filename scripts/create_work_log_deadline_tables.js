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
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_work_log_deadline_config (
                id SERIAL PRIMARY KEY,
                deadline_day INT NOT NULL DEFAULT 5,
                is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by INT REFERENCES we_users(id)
            );
        `);
        console.log('✅ we_work_log_deadline_config 테이블 생성 완료');

        // 기본 설정값 삽입 (없으면)
        await client.query(`
            INSERT INTO we_work_log_deadline_config (deadline_day, is_enabled)
            SELECT 5, TRUE
            WHERE NOT EXISTS (SELECT 1 FROM we_work_log_deadline_config);
        `);
        console.log('✅ 기본 설정값 삽입 완료 (매월 5일 마감)');

        await client.query(`
            CREATE TABLE IF NOT EXISTS we_work_log_deadline_unlocks (
                id SERIAL PRIMARY KEY,
                target_year INT NOT NULL,
                target_month INT NOT NULL,
                reason VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT REFERENCES we_users(id),
                UNIQUE(target_year, target_month)
            );
        `);
        console.log('✅ we_work_log_deadline_unlocks 테이블 생성 완료');

        console.log('\n🎉 마이그레이션 완료!');
    } catch (e) {
        console.error('❌ 오류:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
