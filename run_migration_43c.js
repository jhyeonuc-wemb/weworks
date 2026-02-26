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
        // 1. 카테고리 로우 추가: 3D 모델링 가중치, P&ID 가중치
        await client.query(`
            INSERT INTO we_md_categories (code, name, sort_order) VALUES
                ('modeling3d_weight', '3D 모델링 가중치', 4),
                ('pid_weight', 'P&ID 가중치', 5)
            ON CONFLICT (code) DO NOTHING
        `);
        console.log('✔ new categories inserted (modeling3d_weight, pid_weight)');

        // 2. 3D 모델링 가중치 항목 초기 데이터
        const mdResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'modeling3d_weight'`);
        const mdId = mdResult.rows[0]?.id;
        if (mdId) {
            const mdItems = [
                { cls: '3D 입력 자료', content: '모델링 제공', md: 0.1 },
                { cls: '3D 입력 자료', content: 'CAD 도면 제공', md: 1.0 },
                { cls: '3D 입력 자료', content: 'CAD 일부 + 사진 병행', md: 1.15 },
                { cls: '3D 입력 자료', content: '사진/실측 제공', md: 1.3 },
                { cls: '3D 입력 자료', content: '실측 필요', md: 1.5 },
            ];
            for (let i = 0; i < mdItems.length; i++) {
                const { cls, content, md } = mdItems[i];
                // description 컬럼이 없으므로 content에 합치거나 무시. 여기서는 content만 사용
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                    [mdId, cls, content, md, i]
                );
            }
            console.log('✔ 3D modeling weight items seeded');
        }

        // 3. P&ID 가중치 항목 초기 데이터
        const pidResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'pid_weight'`);
        const pidId = pidResult.rows[0]?.id;
        if (pidId) {
            const pidItems = [
                { cls: '전환 방식', content: '수기 작성', md: 1.0 },
                { cls: '전환 방식', content: 'DrawDX', md: 0.15 },
                { cls: '전환 방식', content: 'MS Visio', md: 0.1 },
                { cls: '전환 방식', content: 'AutoCAD', md: 0.1 },
            ];
            for (let i = 0; i < pidItems.length; i++) {
                const { cls, content, md } = pidItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                    [pidId, cls, content, md, i]
                );
            }
            console.log('✔ P&ID weight items seeded');
        }

        console.log('✅ Migration 43c complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
