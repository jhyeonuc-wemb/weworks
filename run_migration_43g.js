const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

const difficultyItemsToWeights = [
    // 요구사항
    { classification: "요구사항", content: "요구사항 정의서 미제공", description: "구두/회의 중심 전달", standardMd: 2 },
    { classification: "요구사항", content: "요구사항 수시 변경 예상", description: "스펙 Freeze 어려움", standardMd: 2 },
    { classification: "요구사항", content: "고객의 IT 이해도 낮음", description: "기술적 소통 난이도 상승", standardMd: 2 },
    { classification: "요구사항", content: "고객 의사결정자 부재 또는 다수", description: "승인/결정 지연 가능성", standardMd: 2 },
    // 화면, 기능
    { classification: "화면, 기능", content: "화면 ≥ 20개", description: "CRUD 중심 화면, 팝업포함", standardMd: 2 },
    { classification: "화면, 기능", content: "업무 기능 ≥ 5개 모듈로 나눠짐", description: "업무 도메인 분리가 뚜렷함", standardMd: 2 },
    { classification: "화면, 기능", content: "사용자 정의 기능 많음", description: "워크플로우, 조건부 입력 등", standardMd: 2 },
    { classification: "화면, 기능", content: "권한, 조직별 접근 제한 포함", description: "Role-based UI 구성 필요", standardMd: 2 },
    { classification: "화면, 기능", content: "배치 프로세스 포함", description: "예약 실행, 로그처리 등 필요", standardMd: 2 },
    { classification: "화면, 기능", content: "반응형 지원", description: "반응형 지원 개발 필요", standardMd: 2 },
    { classification: "화면, 기능", content: "UI/접근성", description: "모바일 지원 포함 (앱, 웹앱)", standardMd: 2 },
    // 연계 및 외부 시스템
    { classification: "연계 및 외부 시스템", content: "외부 시스템 연계 ≥ 5개", description: "API, DB 연동 등", standardMd: 2 },
    { classification: "연계 및 외부 시스템", content: "실시간 연계 포함", description: "Webhook, Event 등", standardMd: 2 },
    { classification: "연계 및 외부 시스템", content: "레거시 시스템 연계", description: "명세 미비, 파악 난이도 ↑", standardMd: 2 },
    { classification: "연계 및 외부 시스템", content: "인증/SSO 연동 포함", description: "AD, OAuth 등", standardMd: 2 },
    // 데이터 및 보고서
    { classification: "데이터 및 보고서", content: "정형 보고서 ≥ 20건", description: "PDF/Excel 출력 등", standardMd: 2 },
    { classification: "데이터 및 보고서", content: "대용량 데이터 처리", description: "100만건 이상", standardMd: 2 },
    { classification: "데이터 및 보고서", content: "마이그레이션 포함", description: "데이터 정제/이관", standardMd: 2 },
    { classification: "데이터 및 보고서", content: "정합성 검증 포함", description: "정확도 중요", standardMd: 2 },
    // 기술 환경
    { classification: "기술 환경", content: "클라우드 환경 구축", description: "AWS, Azure 등", standardMd: 2 },
    { classification: "기술 환경", content: "Hybrid 인프라", description: "온프 + 클라우드 병행", standardMd: 2 },
    { classification: "기술 환경", content: "신규 기술 도입", description: "AI, IoT, GIS 등", standardMd: 2 },
    { classification: "기술 환경", content: "복잡한 DB (30테이블 이상)", description: "관계 정규화 + 성능 고려", standardMd: 2 },
    // 보안 및 인증
    { classification: "보안 및 인증", content: "사용자 권한 분기 3단계 이상", description: "화면별 권한 설정 필수", standardMd: 2 },
    { classification: "보안 및 인증", content: "데이터 암호화 필요", description: "전송/저장 모두 포함", standardMd: 2 },
    { classification: "보안 및 인증", content: "공공기관 보안규격 준수", description: "ISMS, CC 등 인증 요건 있음", standardMd: 2 },
    // 운영/인력관리
    { classification: "운영/인력관리", content: "납기 ≤ 2개월", description: "기간 촉박", standardMd: 2 },
    { classification: "운영/인력관리", content: "프로젝트 기간 ≥ 12개월", description: "장기 인력 유지/교체 이슈", standardMd: 2 },
    { classification: "운영/인력관리", content: "병행 프로젝트 존재", description: "일정/자원 집중 어려움", standardMd: 2 },
    { classification: "운영/인력관리", content: "개발 서버 운영", description: "운영서버 직접 반영은 어려움", standardMd: 2 },
    { classification: "운영/인력관리", content: "고객 내부 승인 절차 복잡", description: "화면마다 승인 필요", standardMd: 2 },
    { classification: "운영/인력관리", content: "주 단위 납품 일정 요구", description: "세분화된 일정 관리 필요", standardMd: 2 },
    { classification: "운영/인력관리", content: "고객사 상주 필수", description: "피로도, 업무 밀도, 팀 운영 난이도 ↑", standardMd: 2 },
    { classification: "운영/인력관리", content: "상주 위치 원거리", description: "출장, 교통, 숙소 등 추가 리스크", standardMd: 2 },
    { classification: "운영/인력관리", content: "외주 인력과의 협업 필수", description: "SI 협력사, 고객 IT팀, 프리랜서 등 협조 필요", standardMd: 2 },
    { classification: "운영/인력관리", content: "인력 교체 가능성 있음 (예: 6개월 계약)", description: "인수인계 등 중간 공백 위험 존재", standardMd: 2 },
    { classification: "운영/인력관리", content: "고객 내부 정치적 이슈 있음", description: "팀 변경 등 승인 구조 변경", standardMd: 2 },
    // 감리
    { classification: "감리", content: "감리 대상 프로젝트, 공공산출물", description: "일정금액 이상 또는 공공과제", standardMd: 2 },
    { classification: "감리", content: "단계별 감리 진행 (4단계 이상)", description: "분석/설계/개발/종료 감리", standardMd: 2 },
    { classification: "감리", content: "감리 전담 인력 부재", description: "기존 개발팀이 대응까지 담당", standardMd: 2 },
];

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating development weight items with difficulty data...');

        // 1. 기존 'development_weight' 카테고리 ID 가져오기
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

        // 2. 기존 'development_weight' 항목들 삭제 (이전의 잘못된 PM/설계/개발 데이터 삭제)
        await client.query(`
            DELETE FROM we_md_items 
            WHERE category_id = $1
        `, [catId]);
        console.log('✔ existing development_weight items deleted');

        // 3. 40개의 공통 난이도 항목들로 재투입
        for (let i = 0; i < difficultyItemsToWeights.length; i++) {
            const item = difficultyItemsToWeights[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, classification, content, standard_md, description, sort_order) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [catId, item.classification, item.content, item.standardMd, item.description, i]
            );
        }
        console.log('✔ new difficulty items inserted as development weights (' + difficultyItemsToWeights.length + ' rows)');

        console.log('✅ Migration 43g (development weights update) complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
