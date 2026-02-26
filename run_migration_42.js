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
        // VRB 난이도 점수 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_vrb_difficulty_scores (
                id BIGSERIAL PRIMARY KEY,
                vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
                item_id BIGINT NOT NULL,
                item_name TEXT,
                category_id VARCHAR(50) NOT NULL,
                score INTEGER CHECK (score >= 1 AND score <= 10),
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vrb_review_id, item_id)
            )
        `);
        console.log('✔ we_vrb_difficulty_scores created');

        // 인덱스
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_vrb_difficulty_scores_review_id
            ON we_vrb_difficulty_scores(vrb_review_id)
        `);
        console.log('✔ index created');

        // VRB 리뷰 테이블에 난이도 컬럼 추가
        await client.query(`
            ALTER TABLE we_project_vrb_reviews
                ADD COLUMN IF NOT EXISTS difficulty_comment TEXT,
                ADD COLUMN IF NOT EXISTS difficulty_total_score NUMERIC(4,2)
        `);
        console.log('✔ we_project_vrb_reviews columns added');

        console.log('✅ Migration 42 complete');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
