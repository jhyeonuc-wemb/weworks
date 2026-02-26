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
        // overall_weight 컬럼 추가 (이미 있으면 무시)
        await client.query(`
            ALTER TABLE we_md_categories
            ADD COLUMN IF NOT EXISTS overall_weight DECIMAL(5,2) DEFAULT 0
        `);
        console.log('✔ overall_weight column added to we_md_categories');

        // 초기값 설정 (개발 50, 3D모델링 30, P&ID 20)
        await client.query(`UPDATE we_md_categories SET overall_weight = 50 WHERE code = 'development'`);
        await client.query(`UPDATE we_md_categories SET overall_weight = 30 WHERE code = 'modeling3d'`);
        await client.query(`UPDATE we_md_categories SET overall_weight = 20 WHERE code = 'pid'`);
        console.log('✔ default weights set');

        console.log('✅ Migration 43b complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
