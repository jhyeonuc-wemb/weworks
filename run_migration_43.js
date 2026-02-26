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
        // 카테고리 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_md_categories (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ we_md_categories created');

        // 항목 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_md_items (
                id SERIAL PRIMARY KEY,
                category_id INT NOT NULL REFERENCES we_md_categories(id) ON DELETE CASCADE,
                classification VARCHAR(100),
                content VARCHAR(200) NOT NULL,
                standard_md DECIMAL(10,2) DEFAULT 0,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ we_md_items created');

        // 프로젝트별 수량 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS we_project_md_quantities (
                id SERIAL PRIMARY KEY,
                vrb_id INT NOT NULL,
                item_id INT NOT NULL REFERENCES we_md_items(id) ON DELETE CASCADE,
                quantity DECIMAL(10,2) DEFAULT 0,
                calculated_md DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vrb_id, item_id)
            )
        `);
        console.log('✔ we_project_md_quantities created');

        // 인덱스
        await client.query(`CREATE INDEX IF NOT EXISTS idx_we_md_items_category ON we_md_items(category_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_we_project_md_quantities_vrb ON we_project_md_quantities(vrb_id)`);
        console.log('✔ indexes created');

        // 카테고리 초기 데이터
        await client.query(`
            INSERT INTO we_md_categories (code, name, sort_order) VALUES
                ('development', '개발', 1),
                ('modeling3d', '3D 모델링', 2),
                ('pid', 'P&ID', 3)
            ON CONFLICT (code) DO NOTHING
        `);
        console.log('✔ seed categories inserted');

        // 개발 항목 초기 데이터
        const devResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development'`);
        const devId = devResult.rows[0]?.id;
        if (devId) {
            const devItems = [
                { cls: 'PM', content: 'PM/사업관리', md: 5 },
                { cls: '개발', content: '화면 (표준)', md: 2 },
                { cls: '개발', content: '화면 (복잡)', md: 3 },
                { cls: '개발', content: '화면 (단순)', md: 1 },
                { cls: '개발', content: '보고서 (표준)', md: 3 },
                { cls: '개발', content: '보고서 (복잡)', md: 5 },
                { cls: '개발', content: 'ETL/배치', md: 5 },
                { cls: '개발', content: 'GIS/MAP', md: 10 },
                { cls: '개발', content: '3D 애니메이션 (효과, 사운드)', md: 3 },
                { cls: '개발', content: 'SOP 관리', md: 20 },
                { cls: '개발', content: '설정/보고서/통계 등', md: 3 },
                { cls: '개발', content: '메타버스', md: 10 },
                { cls: 'I/F', content: '연계 개발 (단순)', md: 3 },
                { cls: 'I/F', content: '연계 개발 (표준)', md: 5 },
                { cls: 'I/F', content: '연계 개발 (복잡)', md: 10 },
                { cls: '2D디자인', content: '화면 디자인 (시안)', md: 1 },
                { cls: '포탈', content: '개발 환경 구축 (서버 설치 포함)', md: 5 },
                { cls: '포탈', content: '포탈 (게시판/공지/자료실)', md: 5 },
                { cls: '포탈', content: '포탈 (메인/현황판)', md: 3 },
                { cls: '포탈', content: '포탈 (관리자)', md: 5 },
                { cls: '포탈', content: '포탈 (보고서/통계/설정)', md: 2 },
            ];
            for (let i = 0; i < devItems.length; i++) {
                const { cls, content, md } = devItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                    [devId, cls, content, md, i]
                );
            }
            console.log('✔ 개발 items seeded');
        }

        // 3D 모델링 항목
        const mdResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'modeling3d'`);
        const mdId = mdResult.rows[0]?.id;
        if (mdId) {
            const mdItems = [
                { cls: '부지', content: '부지 (대형/비정형)', md: 1 },
                { cls: '건물', content: '건물 (고층/복잡한 구조)', md: 5 },
                { cls: '건물', content: '건물 (중층/일반 구조)', md: 3 },
                { cls: '건물', content: '건물 (저층/단순 구조)', md: 1 },
                { cls: '실내', content: '실내 (고정밀/복잡)', md: 10 },
                { cls: '실내', content: '실내 (표준)', md: 5 },
                { cls: '설비/장비', content: '설비/장비 (상 - 대형/고정밀)', md: 2 },
                { cls: '설비/장비', content: '설비/장비 (중 - 중형)', md: 0.5 },
                { cls: '설비/장비', content: '설비/장비 (하 - 단순 박스)', md: 0 },
                { cls: '설비/장비', content: '설비/장비 (중복 사용)', md: 0.1 },
                { cls: '캐릭터', content: '캐릭터 (메타버스)', md: 5 },
            ];
            for (let i = 0; i < mdItems.length; i++) {
                const { cls, content, md } = mdItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                    [mdId, cls, content, md, i]
                );
            }
            console.log('✔ 3D 모델링 items seeded');
        }

        // P&ID 항목
        const pidResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'pid'`);
        const pidId = pidResult.rows[0]?.id;
        if (pidId) {
            const pidItems = [
                { cls: 'P&ID', content: 'P&ID 도면 (표준)', md: 1 },
                { cls: 'P&ID', content: 'P&ID 도면 (복잡)', md: 1.5 },
                { cls: '배관', content: '배관 Iso (표준)', md: 0.5 },
                { cls: '배관', content: '배관 Iso (복잡)', md: 1 },
                { cls: '장비', content: '장비 상세 모델링', md: 2 },
            ];
            for (let i = 0; i < pidItems.length; i++) {
                const { cls, content, md } = pidItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                    [pidId, cls, content, md, i]
                );
            }
            console.log('✔ P&ID items seeded');
        }

        console.log('✅ Migration 43 complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
