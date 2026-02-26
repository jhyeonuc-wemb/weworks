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
        await client.query(`
      CREATE TABLE IF NOT EXISTS we_difficulty_categories (
        id VARCHAR(50) PRIMARY KEY,
        label VARCHAR(200) NOT NULL,
        overall_weight NUMERIC(5,2) NOT NULL DEFAULT 0,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✔ we_difficulty_categories created');

        await client.query(`
      CREATE TABLE IF NOT EXISTS we_difficulty_items (
        id BIGSERIAL PRIMARY KEY,
        category_id VARCHAR(50) NOT NULL REFERENCES we_difficulty_categories(id) ON DELETE CASCADE,
        name VARCHAR(500) NOT NULL DEFAULT '',
        weight NUMERIC(5,2) NOT NULL DEFAULT 0,
        guide_texts TEXT DEFAULT '',
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✔ we_difficulty_items created');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_we_difficulty_items_category ON we_difficulty_items(category_id)
    `);

        await client.query(`
      INSERT INTO we_difficulty_categories (id, label, overall_weight, display_order) VALUES
        ('tech',  '기술적 난이도',   30, 0),
        ('req',   '요구사항의 복잡성', 25, 1),
        ('team',  '프로젝트 팀 구성', 20, 2),
        ('mgmt',  '프로젝트 관리 요소', 15, 3),
        ('ext',   '외부 의존성 관리', 10, 4)
      ON CONFLICT (id) DO NOTHING
    `);
        console.log('✔ seed categories inserted');

        console.log('✅ Migration 41 complete');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
