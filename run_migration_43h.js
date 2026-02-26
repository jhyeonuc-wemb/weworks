const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

const commonDifficultyItems = [
    // 요구사항
    { category: "공통-요구사항", classification: "요구사항 정의서 미제공", description: "구두/회의 중심 전달", standardMd: 2 },
    { category: "공통-요구사항", classification: "요구사항 수시 변경 예상", description: "스펙 Freeze 어려움", standardMd: 2 },
    { category: "공통-요구사항", classification: "고객의 IT 이해도 낮음", description: "기술적 소통 난이도 상승", standardMd: 2 },
    { category: "공통-요구사항", classification: "고객 의사결정자 부재 또는 다수", description: "승인/결정 지연 가능성", standardMd: 2 },
    // 화면, 기능
    { category: "공통-화면, 기능", classification: "화면 ≥ 20개", description: "CRUD 중심 화면, 팝업포함", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "업무 기능 ≥ 5개 모듈로 나눠짐", description: "업무 도메인 분리가 뚜렷함", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "사용자 정의 기능 많음", description: "워크플로우, 조건부 입력 등", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "권한, 조직별 접근 제한 포함", description: "Role-based UI 구성 필요", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "배치 프로세스 포함", description: "예약 실행, 로그처리 등 필요", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "반응형 지원", description: "반응형 지원 개발 필요", standardMd: 2 },
    { category: "공통-화면, 기능", classification: "UI/접근성", description: "모바일 지원 포함 (앱, 웹앱)", standardMd: 2 },
    // 연계 및 외부 시스템
    { category: "공통-연계 및 외부 시스템", classification: "외부 시스템 연계 ≥ 5개", description: "API, DB 연동 등", standardMd: 2 },
    { category: "공통-연계 및 외부 시스템", classification: "실시간 연계 포함", description: "Webhook, Event 등", standardMd: 2 },
    { category: "공통-연계 및 외부 시스템", classification: "레거시 시스템 연계", description: "명세 미비, 파악 난이도 ↑", standardMd: 2 },
    { category: "공통-연계 및 외부 시스템", classification: "인증/SSO 연동 포함", description: "AD, OAuth 등", standardMd: 2 },
    // 데이터 및 보고서
    { category: "공통-데이터 및 보고서", classification: "정형 보고서 ≥ 20건", description: "PDF/Excel 출력 등", standardMd: 2 },
    { category: "공통-데이터 및 보고서", classification: "대용량 데이터 처리", description: "100만건 이상", standardMd: 2 },
    { category: "공통-데이터 및 보고서", classification: "마이그레이션 포함", description: "데이터 정제/이관", standardMd: 2 },
    { category: "공통-데이터 및 보고서", classification: "정합성 검증 포함", description: "정확도 중요", standardMd: 2 },
    // 기술 환경
    { category: "공통-기술 환경", classification: "클라우드 환경 구축", description: "AWS, Azure 등", standardMd: 2 },
    { category: "공통-기술 환경", classification: "Hybrid 인프라", description: "온프 + 클라우드 병행", standardMd: 2 },
    { category: "공통-기술 환경", classification: "신규 기술 도입", description: "AI, IoT, GIS 등", standardMd: 2 },
    { category: "공통-기술 환경", classification: "복잡한 DB (30테이블 이상)", description: "관계 정규화 + 성능 고려", standardMd: 2 },
    // 보안 및 인증
    { category: "공통-보안 및 인증", classification: "사용자 권한 분기 3단계 이상", description: "화면별 권한 설정 필수", standardMd: 2 },
    { category: "공통-보안 및 인증", classification: "데이터 암호화 필요", description: "전송/저장 모두 포함", standardMd: 2 },
    { category: "공통-보안 및 인증", classification: "공공기관 보안규격 준수", description: "ISMS, CC 등 인증 요건 있음", standardMd: 2 },
    // 운영/인력관리
    { category: "공통-운영/인력관리", classification: "납기 ≤ 2개월", description: "기간 촉박", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "프로젝트 기간 ≥ 12개월", description: "장기 인력 유지/교체 이슈", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "병행 프로젝트 존재", description: "일정/자원 집중 어려움", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "개발 서버 운영", description: "운영서버 직접 반영은 어려움", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "고객 내부 승인 절차 복잡", description: "화면마다 승인 필요", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "주 단위 납품 일정 요구", description: "세분화된 일정 관리 필요", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "고객사 상주 필수", description: "피로도, 업무 밀도, 팀 운영 난이도 ↑", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "상주 위치 원거리", description: "출장, 교통, 숙소 등 추가 리스크", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "외주 인력과의 협업 필수", description: "SI 협력사, 고객 IT팀, 프리랜서 등 협조 필요", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "인력 교체 가능성 있음 (예: 6개월 계약)", description: "인수인계 등 중간 공백 위험 존재", standardMd: 2 },
    { category: "공통-운영/인력관리", classification: "고객 내부 정치적 이슈 있음", description: "팀 변경 등 승인 구조 변경", standardMd: 2 },
    // 감리
    { category: "공통-감리", classification: "감리 대상 프로젝트, 공공산출물", description: "일정금액 이상 또는 공공과제", standardMd: 2 },
    { category: "공통-감리", classification: "단계별 감리 진행 (4단계 이상)", description: "분석/설계/개발/종료 감리", standardMd: 2 },
    { category: "공통-감리", classification: "감리 전담 인력 부재", description: "기존 개발팀이 대응까지 담당", standardMd: 2 },
];

const fieldDifficultyItems = [
    // TIM 서버
    { category: "TIM 서버", classification: "기본 설치 및 환경 구성", description: "Linux/Windows 기반 시스템", standardMd: 2 },
    { category: "TIM 서버", classification: "사용자 및 권한 설정", description: "조직도/사용자 정보 연동 및 Role 구성", standardMd: 2 },
    { category: "TIM 서버", classification: "이중화/HA 구성 지원", description: "고가용성 구축 (기본 이상 세팅 필요)", standardMd: 2 },
    { category: "TIM 서버", classification: "기본 모니터링/로그 설정", description: "운영 효율화를 위한 설정", standardMd: 2 },

    // TIM 클라이언트
    { category: "TIM 팩", classification: "TIM C/S 설치 및 배포", description: "사용자 PC에 직접 설치 지원", standardMd: 2 },
    { category: "TIM 팩", classification: "업데이트 기능 구성", description: "자동/수동 업데이트/패치 지원", standardMd: 2 },
    { category: "TIM 팩", classification: "클라이언트/서버 연동 테스트", description: "기본 기능 동작 및 인증 검증", standardMd: 2 },
    { category: "TIM 팩", classification: "모바일 환경 지원", description: "모바일 접근용 반응형 또는 App 연동", standardMd: 3 },
    { category: "TIM 팩", classification: "사용자 정의 UI/UX 변경", description: "기본 화면 레이아웃 및 디자인 변경 요구", standardMd: 3 },

    // 워커
    { category: "워커", classification: "기본 워커 동작 설정 (스케줄링, 잡)", description: "단순 스케줄/잡 등록", standardMd: 2 },
    { category: "워커", classification: "다중 워커 노드 구성", description: "로드밸런싱 및 분산 처리", standardMd: 3 },
    { category: "워커", classification: "비동기/대용량 트랜잭션 워커 구성", description: "대규모 데이터 동기/처리를 위한 최적화", standardMd: 4 },
    { category: "워커", classification: "상태 관제 및 에러 알람 연동", description: "워커 상태 모니터링 및 SMS/Email 연계", standardMd: 2 },

    // REVISION
    { category: "REVISION", classification: "문서 및 도면 리비전 관리 규칙 설정", description: "일반적인 승인 워크플로", standardMd: 2 },
    { category: "REVISION", classification: "복수 승인선/다단계 프로세스 구성", description: "다수의 결재자 및 분기 조건 포함", standardMd: 3 },
    { category: "REVISION", classification: "이력 추적 및 변경 비교 기능 적용", description: "기본 버전 관리 외 상세 차이/이력 조회", standardMd: 3 },
    { category: "REVISION", classification: "외부 협력사 리뷰 권한/프로세스 적용", description: "망분리 등 복잡한 환경에서의 외부 접근 제어", standardMd: 4 },

    // PMS
    { category: "PMS", classification: "WBS/일정 기본 구성", description: "표준 템플릿 적용", standardMd: 2 },
    { category: "PMS", classification: "다중 프로젝트 포트폴리오 뷰 구성", description: "조직 내 타/유관 프로젝트 정보 통합조회", standardMd: 3 },
    { category: "PMS", classification: "실적(Man-Month) 및 예산 연계", description: "재무/인사 시스템과의 실 데이터 연계", standardMd: 4 },

    // Tag Rule Book
    { category: "Tag Rule Book", classification: "표준 태그 명명 규칙 적용", description: "문서 기반 룰셋 작성 및 반영", standardMd: 2 },
    { category: "Tag Rule Book", classification: "태그 충돌 검증 로직 구현", description: "단순 중복 검사", standardMd: 2 },
    { category: "Tag Rule Book", classification: "Rule 위반사항 모니터링 대시보드", description: "위반 건수/비율 등 가시화", standardMd: 3 },
    { category: "Tag Rule Book", classification: "이기종 시스템 간 태그 매핑 동기화", description: "SAP, EAM 등과의 Tag/규칙 연동", standardMd: 4 },

    // 3D/2D 연계(포탈)
    { category: "3D/2D", classification: "기본 도면(2D) 및 모델(3D) 뷰어 설정", description: "내장 뷰어 연동", standardMd: 2 },
    { category: "3D/2D", classification: "설비/태그 클릭 연계 (2D↔3D↔TIM)", description: "단순 하이퍼링크/속성 연동", standardMd: 2 },
    { category: "3D/2D", classification: "AR/VR 뷰 또는 플랜트 워크스루 구현", description: "고급 시각화, 추가 엔진(Unity, Unreal) 검토 요", standardMd: 5 },

    // e-SOP
    { category: "e-SOP", classification: "표준 운전 절차서 등록 및 배포", description: "기존 PDF/Word 문서 이관 위주", standardMd: 2 },
    { category: "e-SOP", classification: "Checklist 및 승인/결과 기록", description: "온라인 폼 기반 동적 Checklist", standardMd: 3 },
    { category: "e-SOP", classification: "IoT 센서, 설비 데이터 실시간 연계", description: "단계별 운전/제어 시 설비 상태 인터페이스", standardMd: 5 },

    // Dashboard
    { category: "Dashboard", classification: "고객 맞춤형 대시보드 뷰 구성 (5개 이하)", description: "단순 통계 차트 (RDBMS 기반)", standardMd: 2 },
    { category: "Dashboard", classification: "고객 맞춤형 대시보드 뷰 구성 (6개 이상)", description: "복합 통계/다양한 차트 필요", standardMd: 3 },

    // EDMS
    { category: "EDMS", classification: "기본 문서함(폴더 구조) 셋업", description: "조직/권한 기반 폴더 및 접근 제어", standardMd: 2 },
    { category: "EDMS", classification: "결재/배포(Transmittal) 프로세스 적용", description: "기본 양식 연동", standardMd: 2 },
    { category: "EDMS", classification: "외부 고객사/협력사(Vendor) 연계 배포", description: "보안이 요구되는 외부망 배포 채널 구성", standardMd: 3 },
    { category: "EDMS", classification: "대규모 마이그레이션 및 메타데이터 정제", description: "기존 레거시 또는 File Server 데이터 이관", standardMd: 4 },

    // QMS
    { category: "QMS", classification: "품질 기준 및 체크리스트 구성", description: "검사/부적합 관리 기본 세팅", standardMd: 2 },
    { category: "QMS", classification: "CAPA (시정 및 예방 조치) 흐름 구현", description: "복합 승인/추적 워크플로", standardMd: 3 },
    { category: "QMS", classification: "현장 모바일 점검 (오프라인 동기화 필요)", description: "현장용 앱 또는 웹 지원, 오프라인 모드 포함 여부", standardMd: 4 },

    // Handover
    { category: "Handover", classification: "산출물 일괄 이관(Export) 기능", description: "단순 파일(도면/문서) 다운로드 및 패키징", standardMd: 2 },
    { category: "Handover", classification: "인수인계 데이터 검증/무결성 체크", description: "필수 메타데이터/파일 누락 여부 검사 로직", standardMd: 3 },
    { category: "Handover", classification: "발주처 시스템(포털 등) 직접 연계", description: "완성된 최종 산출물을 외부 시스템으로 API 인터페이스", standardMd: 4 },

    // Material
    { category: "Material", classification: "자재 마스터 및 품목 기초 데이터 등록", description: "분류체계(BOM 등) 설정", standardMd: 2 },
    { category: "Material", classification: "입점/출고/재고 관리 프로세스 구성", description: "표준 입출고 워크플로 적용", standardMd: 2 },

    // Inspection
    { category: "Inspection", classification: "기본 검사 스케줄 등록/관리", description: "정기/수시 검사 일정 및 알림 설정", standardMd: 2 },

    // Precom
    { category: "Precom", classification: "Pre-commissioning 시스템/루프 정보 등록", description: "대상 시스템 기초 데이터 구축", standardMd: 2 },

    // Vendor
    { category: "Vendor", classification: "협력사(벤더) 포털 계정 및 권한 분리", description: "외부망/내부망 분리에 따른 계정 연동 포함", standardMd: 3 },
];

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating development weight items (with category split)...');

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

        // 2. we_md_items 테이블에 item_category 컬럼이 없다면 추가
        console.log('Checking item_category column...');
        await client.query(`
            ALTER TABLE we_md_items 
            ADD COLUMN IF NOT EXISTS item_category VARCHAR(100)
        `);

        // 3. 기존 'development_weight' 항목들 삭제
        await client.query(`
            DELETE FROM we_md_items 
            WHERE category_id = $1
        `, [catId]);
        console.log('✔ existing development_weight items deleted');

        const allItems = [...commonDifficultyItems, ...fieldDifficultyItems];

        // 4. 새로운 항목들로 재투입 (item_category 컬럼 포함)
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, item_category, classification, content, standard_md, description, sort_order) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [catId, item.category, item.category, item.classification, item.standardMd, item.description, i]
            );
        }
        console.log('✔ new difficulty items inserted as development weights (' + allItems.length + ' rows)');

        console.log('✅ Migration 43h (development weights upgrade) complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
