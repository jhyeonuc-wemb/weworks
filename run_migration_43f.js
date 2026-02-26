const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

const defaultRoleWeightTable = [
    { classification: "역할", content: "PM", standardMd: 1.0, description: "프로젝트 매니저" },
    { classification: "역할", content: "개발", standardMd: 1.0, description: "개발자" },
    { classification: "역할", content: "설계", standardMd: 1.0, description: "시스템 설계자" },
    { classification: "역할", content: "I/F", standardMd: 1.0, description: "인터페이스 개발자" },
    { classification: "역할", content: "QA", standardMd: 1.0, description: "품질 보증" },
];

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating development weight items...');

        // 1. 카테고리 추가 유무 확인 및 생성
        const catQuery = `SELECT id FROM we_md_categories WHERE code = 'development_weight'`;
        let catResult = await client.query(catQuery);

        if (catResult.rows.length === 0) {
            console.log('Inserting category development_weight...');
            const insertCatResult = await client.query(`
                INSERT INTO we_md_categories (code, name, sort_order) 
                VALUES ('development_weight', '가중치 (개발)', 10) RETURNING id
            `);
            catResult = insertCatResult;
        }

        const catId = catResult.rows[0].id;

        // 2. 기존 'development_weight' 항목들 삭제
        await client.query(`
            DELETE FROM we_md_items 
            WHERE category_id = $1
        `, [catId]);
        console.log('✔ existing development_weight items deleted');

        // 3. 새로운 오리지널 항목들로 재투입
        for (let i = 0; i < defaultRoleWeightTable.length; i++) {
            const item = defaultRoleWeightTable[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, classification, content, standard_md, description, sort_order) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [catId, item.classification, item.content, item.standardMd, item.description, i]
            );
        }
        console.log('✔ new development weight items inserted (' + defaultRoleWeightTable.length + ' rows)');

        console.log('✅ Migration 43f (development weights) complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
