const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

const defaultDevelopmentItems = [
    // PM
    { classification: "PM", content: "PM/사업관리", standardMd: 5, description: "" },
    // 개발
    { classification: "개발", content: "개발 환경 구축 (서버 설치 포함)", standardMd: 5, description: "" },
    { classification: "개발", content: "운영 환경 구축", standardMd: 5, description: "" },
    { classification: "개발", content: "공통 (로그인, 메뉴, 권한, 레이아웃 등)", standardMd: 10, description: "" },
    { classification: "개발", content: "화면(컨텐츠 ≤ 5) 설계 (팝업 포함)", standardMd: 2, description: "" },
    { classification: "개발", content: "화면(컨텐츠 ≥ 5) 설계 (팝업 포함)", standardMd: 3, description: "" },
    { classification: "개발", content: "화면 개발(컨텐츠 ≤ 5) (팝업 포함)", standardMd: 2, description: "" },
    { classification: "개발", content: "화면 개발(컨텐츠 ≥ 5) (팝업 포함)", standardMd: 3, description: "" },
    { classification: "개발", content: "3D 애니메이션 (효과, 사운드)", standardMd: 3, description: "" },
    { classification: "개발", content: "SOP 관리", standardMd: 20, description: "" },
    { classification: "개발", content: "설정/보고서/통계 등", standardMd: 3, description: "" },
    { classification: "개발", content: "메타버스", standardMd: 10, description: "" },
    // I/F
    { classification: "I/F", content: "연계시스템 (분석, 설계)", standardMd: 5, description: "" },
    { classification: "I/F", content: "TIM 워커 DB to DB 등 간단", standardMd: 1, description: "" },
    { classification: "I/F", content: "TIM 그 외 워커", standardMd: 2, description: "" },
    { classification: "I/F", content: "제품 미사용 연계 개발", standardMd: 5, description: "" },
    { classification: "I/F", content: "TIM+ 워크플로우 간단", standardMd: 2, description: "" },
    { classification: "I/F", content: "TIM+ 워크플로우 복잡", standardMd: 3, description: "" },
    { classification: "I/F", content: "DB(테이블) 설계", standardMd: 0.5, description: "" },
    // 2D디자인
    { classification: "2D디자인", content: "공통 컨셉 디자인", standardMd: 5, description: "" },
    { classification: "2D디자인", content: "화면 디자인 (시안)", standardMd: 1, description: "" },
    // 포탈
    { classification: "포탈", content: "개발 환경 구축 (서버 설치 포함)", standardMd: 5, description: "" },
    { classification: "포탈", content: "운영 환경 구축", standardMd: 5, description: "" },
    { classification: "포탈", content: "공통 (로그인, 메뉴, 권한, 레이아웃 등)", standardMd: 10, description: "" },
    { classification: "포탈", content: "포탈 (보고서/통계/설정)", standardMd: 2, description: "" },
];

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating development items...');

        // 1. 기존 'development' 항목들 삭제
        await client.query(`
            DELETE FROM we_md_items 
            WHERE category_id = (SELECT id FROM we_md_categories WHERE code = 'development')
        `);
        console.log('✔ existing development items deleted');

        // 2. 새로운 오리지널 항목들로 재투입
        const devResult = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development'`);
        const devId = devResult.rows[0]?.id;

        if (devId) {
            for (let i = 0; i < defaultDevelopmentItems.length; i++) {
                const item = defaultDevelopmentItems[i];
                await client.query(
                    `INSERT INTO we_md_items (category_id, classification, content, standard_md, description, sort_order) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [devId, item.classification, item.content, item.standardMd, item.description, i]
                );
            }
            console.log('✔ new development items inserted (' + defaultDevelopmentItems.length + ' rows)');
        }

        console.log('✅ Migration 43e (reseed development) complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
