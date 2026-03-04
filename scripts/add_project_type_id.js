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
        console.log('Connected. Running migration...');

        await client.query(`
            ALTER TABLE we_projects
            ADD COLUMN IF NOT EXISTS project_type_id BIGINT REFERENCES we_codes(id)
        `);
        console.log('Column project_type_id added to we_projects.');

        // 컬럼 확인
        const result = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'we_projects' AND column_name = 'project_type_id'
        `);
        if (result.rows.length > 0) {
            console.log('✅ Verified:', result.rows[0].column_name, ':', result.rows[0].data_type);
        }

        // CD_002_05_01 하위 코드 확인
        const types = await client.query(`
            SELECT id, code, name FROM we_codes
            WHERE parent_code = 'CD_002_05_01'
            ORDER BY sort_order, id
        `);
        console.log('\nCD_002_05_01 하위 프로젝트 유형 목록:');
        types.rows.forEach(r => console.log(`  - [${r.id}] ${r.code}: ${r.name}`));

    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
