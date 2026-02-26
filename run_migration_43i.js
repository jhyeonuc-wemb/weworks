const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

// VRB 화면 가중치 탭의 "공통 난이도 산정" 항목
const commonDifficultyItems = [
    // 요구사항
    { category: "요구사항", content: "요구사항 정의서 미제공", description: "구두/회의 중심 전달" },
    { category: "요구사항", content: "요구사항 수시 변경 예상", description: "스펙 Freeze 어려움" },
    { category: "요구사항", content: "고객의 IT 이해도 낮음", description: "기술적 소통 난이도 상승" },
    { category: "요구사항", content: "고객 의사결정자 부재 또는 다수", description: "승인/결정 지연 가능성" },
    // 화면, 기능
    { category: "화면, 기능", content: "화면 ≥ 20개", description: "CRUD 중심 화면, 팝업포함" },
    { category: "화면, 기능", content: "업무 기능 ≥ 5개 모듈로 나눠짐", description: "업무 도메인 분리가 뚜렷함" },
    { category: "화면, 기능", content: "사용자 정의 기능 많음", description: "워크플로우, 조건부 입력 등" },
    { category: "화면, 기능", content: "권한, 조직별 접근 제한 포함", description: "Role-based UI 구성 필요" },
    { category: "화면, 기능", content: "배치 프로세스 포함", description: "예약 실행, 로그처리 등 필요" },
    { category: "화면, 기능", content: "반응형 지원", description: "반응형 지원 개발 필요" },
    { category: "화면, 기능", content: "UI/접근성", description: "모바일 지원 포함 (앱, 웹앱)" },
    // 연계 및 외부 시스템
    { category: "연계 및 외부 시스템", content: "외부 시스템 연계 ≥ 5개", description: "API, DB 연동 등" },
    { category: "연계 및 외부 시스템", content: "실시간 연계 포함", description: "Webhook, Event 등" },
    { category: "연계 및 외부 시스템", content: "레거시 시스템 연계", description: "명세 미비, 파악 난이도 ↑" },
    { category: "연계 및 외부 시스템", content: "인증/SSO 연동 포함", description: "AD, OAuth 등" },
    // 데이터 및 보고서
    { category: "데이터 및 보고서", content: "정형 보고서 ≥ 20건", description: "PDF/Excel 출력 등" },
    { category: "데이터 및 보고서", content: "대용량 데이터 처리", description: "100만건 이상" },
    { category: "데이터 및 보고서", content: "마이그레이션 포함", description: "데이터 정제/이관" },
    { category: "데이터 및 보고서", content: "정합성 검증 포함", description: "정확도 중요" },
    // 기술 환경
    { category: "기술 환경", content: "클라우드 환경 구축", description: "AWS, Azure 등" },
    { category: "기술 환경", content: "Hybrid 인프라", description: "온프 + 클라우드 병행" },
    { category: "기술 환경", content: "신규 기술 도입", description: "AI, IoT, GIS 등" },
    { category: "기술 환경", content: "복잡한 DB (30테이블 이상)", description: "관계 정규화 + 성능 고려" },
    // 보안 및 인증
    { category: "보안 및 인증", content: "사용자 권한 분기 3단계 이상", description: "화면별 권한 설정 필수" },
    { category: "보안 및 인증", content: "데이터 암호화 필요", description: "전송/저장 모두 포함" },
    { category: "보안 및 인증", content: "공공기관 보안규격 준수", description: "ISMS, CC 등 인증 요건 있음" },
    // 운영/인력관리
    { category: "운영/인력관리", content: "납기 ≤ 2개월", description: "기간 촉박" },
    { category: "운영/인력관리", content: "프로젝트 기간 ≥ 12개월", description: "장기 인력 유지/교체 이슈" },
    { category: "운영/인력관리", content: "병행 프로젝트 존재", description: "일정/자원 집중 어려움" },
    { category: "운영/인력관리", content: "개발 서버 운영", description: "운영서버 직접 반영은 어려움" },
    { category: "운영/인력관리", content: "고객 내부 승인 절차 복잡", description: "화면마다 승인 필요" },
    { category: "운영/인력관리", content: "주 단위 납품 일정 요구", description: "세분화된 일정 관리 필요" },
    { category: "운영/인력관리", content: "고객사 상주 필수", description: "피로도, 업무 밀도, 팀 운영 난이도 ↑" },
    { category: "운영/인력관리", content: "상주 위치 원거리", description: "출장, 교통, 숙소 등 추가 리스크" },
    { category: "운영/인력관리", content: "외주 인력과의 협업 필수", description: "SI 협력사, 고객 IT팀, 프리랜서 등 협조 필요" },
    { category: "운영/인력관리", content: "인력 교체 가능성 있음 (예: 6개월 계약)", description: "인수인계 등 중간 공백 위험 존재" },
    { category: "운영/인력관리", content: "고객 내부 정치적 이슈 있음", description: "팀 변경 등 승인 구조 변경" },
    // 감리
    { category: "감리", content: "감리 대상 프로젝트, 공공산출물", description: "일정금액 이상 또는 공공과제" },
    { category: "감리", content: "단계별 감리 진행 (4단계 이상)", description: "분석/설계/개발/종료 감리" },
    { category: "감리", content: "감리 전담 인력 부재", description: "기존 개발팀이 대응까지 담당" },
];

// VRB 화면 가중치 탭의 "분야별 난이도 산정" 항목
const fieldDifficultyItems = [
    // TIM 서버
    { category: "TIM 서버", content: "기본 설치 및 환경 구성", description: "Linux/Windows 기반 시스템" },
    { category: "TIM 서버", content: "사용자 및 권한 설정", description: "조직도/사용자 정보 연동 및 Role 구성" },
    { category: "TIM 서버", content: "이중화/HA 구성 지원", description: "고가용성 구축 (기본 이상 세팅 필요)" },
    { category: "TIM 서버", content: "기본 모니터링/로그 설정", description: "운영 효율화를 위한 설정" },
    // TIM 팩
    { category: "TIM 팩", content: "TIM C/S 설치 및 배포", description: "사용자 PC에 직접 설치 지원" },
    { category: "TIM 팩", content: "업데이트 기능 구성", description: "자동/수동 업데이트/패치 지원" },
    { category: "TIM 팩", content: "클라이언트/서버 연동 테스트", description: "기본 기능 동작 및 인증 검증" },
    { category: "TIM 팩", content: "모바일 환경 지원", description: "모바일 접근용 반응형 또는 App 연동" },
    { category: "TIM 팩", content: "사용자 정의 UI/UX 변경", description: "기본 화면 레이아웃 및 디자인 변경 요구" },
    // 워커
    { category: "워커", content: "기본 워커 동작 설정 (스케줄링, 잡)", description: "단순 스케줄/잡 등록" },
    { category: "워커", content: "다중 워커 노드 구성", description: "로드밸런싱 및 분산 처리" },
    { category: "워커", content: "비동기/대용량 트랜잭션 워커 구성", description: "대규모 데이터 동기/처리를 위한 최적화" },
    { category: "워커", content: "상태 관제 및 에러 알람 연동", description: "워커 상태 모니터링 및 SMS/Email 연계" },
    // REVISION
    { category: "REVISION", content: "문서 및 도면 리비전 관리 규칙 설정", description: "일반적인 승인 워크플로" },
    { category: "REVISION", content: "복수 승인선/다단계 프로세스 구성", description: "다수의 결재자 및 분기 조건 포함" },
    { category: "REVISION", content: "이력 추적 및 변경 비교 기능 적용", description: "기본 버전 관리 외 상세 차이/이력 조회" },
    { category: "REVISION", content: "외부 협력사 리뷰 권한/프로세스 적용", description: "망분리 등 복잡한 환경에서의 외부 접근 제어" },
    // PMS
    { category: "PMS", content: "WBS/일정 기본 구성", description: "표준 템플릿 적용" },
    { category: "PMS", content: "다중 프로젝트 포트폴리오 뷰 구성", description: "조직 내 타/유관 프로젝트 정보 통합조회" },
    { category: "PMS", content: "실적(Man-Month) 및 예산 연계", description: "재무/인사 시스템과의 실 데이터 연계" },
    // Tag Rule Book
    { category: "Tag Rule Book", content: "표준 태그 명명 규칙 적용", description: "문서 기반 룰셋 작성 및 반영" },
    { category: "Tag Rule Book", content: "태그 충돌 검증 로직 구현", description: "단순 중복 검사" },
    { category: "Tag Rule Book", content: "Rule 위반사항 모니터링 대시보드", description: "위반 건수/비율 등 가시화" },
    { category: "Tag Rule Book", content: "이기종 시스템 간 태그 매핑 동기화", description: "SAP, EAM 등과의 Tag/규칙 연동" },
    // 3D/2D
    { category: "3D/2D", content: "기본 도면(2D) 및 모델(3D) 뷰어 설정", description: "내장 뷰어 연동" },
    { category: "3D/2D", content: "설비/태그 클릭 연계 (2D↔3D↔TIM)", description: "단순 하이퍼링크/속성 연동" },
    { category: "3D/2D", content: "AR/VR 뷰 또는 플랜트 워크스루 구현", description: "고급 시각화, 추가 엔진(Unity, Unreal) 검토 요" },
    // e-SOP
    { category: "e-SOP", content: "표준 운전 절차서 등록 및 배포", description: "기존 PDF/Word 문서 이관 위주" },
    { category: "e-SOP", content: "Checklist 및 승인/결과 기록", description: "온라인 폼 기반 동적 Checklist" },
    { category: "e-SOP", content: "IoT 센서, 설비 데이터 실시간 연계", description: "단계별 운전/제어 시 설비 상태 인터페이스" },
    // Dashboard
    { category: "Dashboard", content: "고객 맞춤형 대시보드 뷰 구성 (5개 이하)", description: "단순 통계 차트 (RDBMS 기반)" },
    { category: "Dashboard", content: "고객 맞춤형 대시보드 뷰 구성 (6개 이상)", description: "복합 통계/다양한 차트 필요" },
    // EDMS
    { category: "EDMS", content: "기본 문서함(폴더 구조) 셋업", description: "조직/권한 기반 폴더 및 접근 제어" },
    { category: "EDMS", content: "결재/배포(Transmittal) 프로세스 적용", description: "기본 양식 연동" },
    { category: "EDMS", content: "외부 고객사/협력사(Vendor) 연계 배포", description: "보안이 요구되는 외부망 배포 채널 구성" },
    { category: "EDMS", content: "대규모 마이그레이션 및 메타데이터 정제", description: "기존 레거시 또는 File Server 데이터 이관" },
    // QMS
    { category: "QMS", content: "품질 기준 및 체크리스트 구성", description: "검사/부적합 관리 기본 세팅" },
    { category: "QMS", content: "CAPA (시정 및 예방 조치) 흐름 구현", description: "복합 승인/추적 워크플로" },
    { category: "QMS", content: "현장 모바일 점검 (오프라인 동기화 필요)", description: "현장용 앱 또는 웹 지원, 오프라인 모드 포함 여부" },
    // Handover
    { category: "Handover", content: "산출물 일괄 이관(Export) 기능", description: "단순 파일(도면/문서) 다운로드 및 패키징" },
    { category: "Handover", content: "인수인계 데이터 검증/무결성 체크", description: "필수 메타데이터/파일 누락 여부 검사 로직" },
    { category: "Handover", content: "발주처 시스템(포털 등) 직접 연계", description: "완성된 최종 산출물을 외부 시스템으로 API 인터페이스" },
    // Material
    { category: "Material", content: "자재 마스터 및 품목 기초 데이터 등록", description: "분류체계(BOM 등) 설정" },
    { category: "Material", content: "입점/출고/재고 관리 프로세스 구성", description: "표준 입출고 워크플로 적용" },
    // Inspection
    { category: "Inspection", content: "기본 검사 스케줄 등록/관리", description: "정기/수시 검사 일정 및 알림 설정" },
    // Precom
    { category: "Precom", content: "Pre-commissioning 시스템/루프 정보 등록", description: "대상 시스템 기초 데이터 구축" },
    // Vendor
    { category: "Vendor", content: "협력사(벤더) 포털 계정 및 권한 분리", description: "외부망/내부망 분리에 따른 계정 연동 포함" },
];

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration 43i: Split development_weight into 2 categories...');

        // 1. 기존 development_weight 카테고리 삭제 (항목 포함)
        const oldCat = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development_weight'`);
        if (oldCat.rows.length > 0) {
            const oldId = oldCat.rows[0].id;
            await client.query(`DELETE FROM we_md_items WHERE category_id = $1`, [oldId]);
            await client.query(`DELETE FROM we_md_categories WHERE id = $1`, [oldId]);
            console.log('✔ Deleted old development_weight category and items');
        }

        // 2. 공통 난이도 산정 카테고리 생성
        let commonCatId;
        const existingCommon = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development_common_weight'`);
        if (existingCommon.rows.length > 0) {
            commonCatId = existingCommon.rows[0].id;
            await client.query(`DELETE FROM we_md_items WHERE category_id = $1`, [commonCatId]);
            console.log('✔ Cleared existing development_common_weight items');
        } else {
            const res = await client.query(
                `INSERT INTO we_md_categories (code, name, sort_order) VALUES ('development_common_weight', '공통 난이도 산정', 10) RETURNING id`
            );
            commonCatId = res.rows[0].id;
            console.log('✔ Created development_common_weight category');
        }

        // 3. 분야별 난이도 산정 카테고리 생성
        let fieldCatId;
        const existingField = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development_field_weight'`);
        if (existingField.rows.length > 0) {
            fieldCatId = existingField.rows[0].id;
            await client.query(`DELETE FROM we_md_items WHERE category_id = $1`, [fieldCatId]);
            console.log('✔ Cleared existing development_field_weight items');
        } else {
            const res = await client.query(
                `INSERT INTO we_md_categories (code, name, sort_order) VALUES ('development_field_weight', '분야별 난이도 산정', 11) RETURNING id`
            );
            fieldCatId = res.rows[0].id;
            console.log('✔ Created development_field_weight category');
        }

        // 4. item_category 컬럼 확인
        await client.query(`ALTER TABLE we_md_items ADD COLUMN IF NOT EXISTS item_category VARCHAR(100)`);

        // 5. 공통 난이도 항목 삽입 (classification=구분, content=내용, description=설명)
        for (let i = 0; i < commonDifficultyItems.length; i++) {
            const item = commonDifficultyItems[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, item_category, content, description, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                [commonCatId, item.category, item.content, item.description, 0, i]
            );
        }
        console.log(`✔ Inserted ${commonDifficultyItems.length} common difficulty items`);

        // 6. 분야별 난이도 항목 삽입
        for (let i = 0; i < fieldDifficultyItems.length; i++) {
            const item = fieldDifficultyItems[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, item_category, content, description, standard_md, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                [fieldCatId, item.category, item.content, item.description, 0, i]
            );
        }
        console.log(`✔ Inserted ${fieldDifficultyItems.length} field difficulty items`);

        console.log('✅ Migration 43i complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
