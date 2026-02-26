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
        // 1. description 컬럼 추가
        await client.query(`
            ALTER TABLE we_md_items
            ADD COLUMN IF NOT EXISTS description TEXT
        `);
        console.log('✔ description column added to we_md_items');

        // 2. 기존 가중치 데이터 삭제 (초기화)
        await client.query(`
            DELETE FROM we_md_items 
            WHERE category_id IN (
                SELECT id FROM we_md_categories WHERE code IN ('modeling3d_weight', 'pid_weight')
            )
        `);
        console.log('✔ existing weight items deleted');

        // 3. 3D 모델링 가중치 재삽입 (설명 포함)
        const mdResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'modeling3d_weight'`);
        const mdId = mdResult.rows[0]?.id;
        if (mdId) {
            const mdItems = [
                { cls: '3D 입력 자료', content: '모델링 제공', md: 0.1, desc: '배치 등' },
                { cls: '3D 입력 자료', content: 'CAD 도면 제공', md: 1.0, desc: 'DWG/IFC 등 정합성 양호' },
                { cls: '3D 입력 자료', content: 'CAD 일부 + 사진 병행', md: 1.15, desc: '누락 도면 보완 필요' },
                { cls: '3D 입력 자료', content: '사진/실측 제공', md: 1.3, desc: '3D 모델링을 사진 기반 추정' },
                { cls: '3D 입력 자료', content: '실측 필요', md: 1.5, desc: '현장 실측 → 모델화' },
            ];
            for (let i = 0; i < mdItems.length; i++) {
                const { cls, content, md, desc } = mdItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, description, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [mdId, cls, content, md, desc, i]
                );
            }
            console.log('✔ 3D modeling weight items re-seeded with description');
        }

        // 4. P&ID 가중치 재삽입 (설명 포함)
        const pidResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'pid_weight'`);
        const pidId = pidResult.rows[0]?.id;
        if (pidId) {
            const pidItems = [
                { cls: '전환 방식', content: '수기 작성', md: 1.0, desc: '배경을 따라서 수기로 작성' },
                { cls: '전환 방식', content: 'DrawDX', md: 0.15, desc: '자동 인식 후 결과 보정' },
                { cls: '전환 방식', content: 'MS Visio', md: 0.1, desc: 'Visio 인식 (지원 예정)' },
                { cls: '전환 방식', content: 'AutoCAD', md: 0.1, desc: 'AutoCAD(DWG) 파일 제공' },
            ];
            for (let i = 0; i < pidItems.length; i++) {
                const { cls, content, md, desc } = pidItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, description, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [pidId, cls, content, md, desc, i]
                );
            }
            console.log('✔ P&ID weight items re-seeded with description');
        }

        console.log('✅ Migration 43d complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
