const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        user: 'weworks',
        host: '115.21.12.186',
        database: 'weworks',
        password: 'weworks!1234',
        port: 7432,
    });

    try {
        await client.connect();

        // 외주 업체별 계획 상세 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_project_settlement_ext_company (
                id SERIAL PRIMARY KEY,
                settlement_id INTEGER REFERENCES we_project_settlement(id) ON DELETE CASCADE,
                company_name TEXT,
                role1 TEXT,
                role2 TEXT,
                plan_mm JSONB,
                plan_amt JSONB,
                exec_mm JSONB,
                exec_amt JSONB,
                display_order INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Migration successful: we_project_settlement_ext_company created.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
