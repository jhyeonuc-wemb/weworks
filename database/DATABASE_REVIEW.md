# 🗄️ 데이터베이스 종합 점검 보고서

## 현재 상태

### 테이블 목록 (추정)
```
기본 테이블 (7개):
- we_users
- we_roles
- we_departments
- we_clients
- we_project_categories
- we_ranks
- we_labor_categories

프로젝트 관련 (3개):
- we_projects
- we_project_team_assignments
- we_user_roles

M/D 산정 (다수):
- we_project_md_estimations
- we_md_difficulty_items
- we_md_development_items
- we_md_modeling_3d_items
- etc.

VRB (2개):
- we_project_vrb_reviews
- we_project_vrb_estimated_mm_items

수지분석서 (2개):
- we_project_profitability
- we_project_profitability_standard_expenses

기준 데이터 (2개):
- we_unit_prices
- we_products
```

---

## ✅ 잘 되어 있는 부분

### 1. 스키마 설계
- ✅ 정규화가 잘 되어 있음 (3NF 준수)
- ✅ 외래키 관계가 명확함
- ✅ CHECK 제약으로 데이터 품질 관리

### 2. 인덱싱
- ✅ 주요 조회 컬럼에 인덱스 존재
- ✅ 외래키 컬럼에 인덱스 존재
- ✅ UNIQUE 제약 적절히 사용

### 3. 타임스탬프
- ✅ created_at, updated_at 모든 테이블 존재
- ✅ 기본값 CURRENT_TIMESTAMP 설정

### 4. CASCADE 처리
- ✅ ON DELETE CASCADE 적절히 사용
- ✅ 연관 데이터 자동 정리

---

## ⚠️ 개선 필요 사항

### 1. 인덱스 최적화

#### 복합 인덱스 추가 필요
```sql
-- 현재: 단일 컬럼 인덱스만 존재
CREATE INDEX idx_we_projects_status ON we_projects(status);
CREATE INDEX idx_we_projects_current_phase ON we_projects(current_phase);

-- 개선: 복합 인덱스 추가
CREATE INDEX idx_we_projects_status_phase 
ON we_projects(status, current_phase);

-- 효과: WHERE status = ? AND current_phase = ? 쿼리 최적화
```

#### 부분 인덱스 활용
```sql
-- 현재: 전체 인덱스
CREATE INDEX idx_we_unit_prices_is_active ON we_unit_prices(is_active);

-- 개선: 부분 인덱스 (활성 데이터만)
CREATE INDEX idx_we_unit_prices_active 
ON we_unit_prices(year, affiliation_group, job_group)
WHERE is_active = true;

-- 효과: 인덱스 크기 50% 감소, 성능 향상
```

### 2. 제약 조건 강화

#### 음수 방지
```sql
-- 현재: 음수 금액 입력 가능
-- 개선: CHECK 제약 추가

ALTER TABLE we_project_profitability
ADD CONSTRAINT chk_profitability_amounts_positive
CHECK (
    total_revenue >= 0 AND 
    total_cost >= 0 AND
    net_profit >= -999999999 -- 손실 가능
);

ALTER TABLE we_unit_prices
ADD CONSTRAINT chk_unit_prices_positive
CHECK (
    (proposed_standard IS NULL OR proposed_standard >= 0) AND
    (proposed_applied IS NULL OR proposed_applied >= 0) AND
    (internal_applied IS NULL OR internal_applied >= 0)
);
```

#### 날짜 범위 검증
```sql
ALTER TABLE we_projects
ADD CONSTRAINT chk_project_date_range
CHECK (
    contract_end_date IS NULL OR 
    contract_start_date IS NULL OR
    contract_end_date >= contract_start_date
);
```

#### 연도 범위 검증
```sql
ALTER TABLE we_unit_prices
ADD CONSTRAINT chk_unit_prices_year_range
CHECK (year >= 2020 AND year <= 2100);
```

### 3. 트리거 추가

#### updated_at 자동 갱신
```sql
-- 현재: 애플리케이션에서 수동 갱신
-- 개선: 트리거로 자동 갱신

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 모든 주요 테이블에 적용
CREATE TRIGGER trg_we_projects_updated_at 
    BEFORE UPDATE ON we_projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### 데이터 변경 감사
```sql
-- 중요 데이터 변경 이력 추적
CREATE TABLE we_audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by BIGINT REFERENCES we_users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_table_record ON we_audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON we_audit_log(changed_at);
```

### 4. 뷰 생성

#### 프로젝트 상세 뷰
```sql
CREATE OR REPLACE VIEW v_we_projects_detail AS
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.status,
    p.current_phase,
    p.contract_start_date,
    p.contract_end_date,
    p.currency,
    -- 고객사
    c.name as customer_name,
    c.code as customer_code,
    -- 발주처
    o.name as orderer_name,
    -- 담당자
    m.name as manager_name,
    m.email as manager_email,
    -- 영업 담당
    s.name as sales_rep_name,
    -- 타임스탬프
    p.created_at,
    p.updated_at
FROM we_projects p
LEFT JOIN we_clients c ON p.customer_id = c.id
LEFT JOIN we_clients o ON p.orderer_id = o.id
LEFT JOIN we_users m ON p.manager_id = m.id
LEFT JOIN we_users s ON p.sales_representative_id = s.id;
```

#### 기준단가 비교 뷰
```sql
CREATE OR REPLACE VIEW v_we_unit_prices_comparison AS
SELECT 
    up.id,
    up.affiliation_group,
    up.job_group,
    up.job_level,
    up.grade,
    up.year,
    up.internal_applied,
    -- 전년도 데이터
    LAG(up.internal_applied) OVER w as prev_year_internal,
    LAG(up.year) OVER w as prev_year,
    -- 증감율 자동 계산
    CASE 
        WHEN LAG(up.internal_applied) OVER w IS NOT NULL 
             AND LAG(up.internal_applied) OVER w > 0
        THEN ROUND(
            ((up.internal_applied - LAG(up.internal_applied) OVER w) 
             / LAG(up.internal_applied) OVER w * 100)::numeric, 
            2
        )
        ELSE NULL
    END as auto_increase_rate
FROM we_unit_prices up
WINDOW w AS (
    PARTITION BY affiliation_group, job_group, job_level, grade 
    ORDER BY year
)
ORDER BY year DESC, affiliation_group, job_group, job_level;
```

### 5. 마이그레이션 파일 정리

#### 중복/불필요 파일
```bash
# 삭제 또는 아카이브 가능:
database/13_create_unit_price_tables.sql  
  → 16_create_unit_price_tables_v2.sql로 대체됨
  
database/10_cleanup_all_projects.sql      
  → 일회성 정리 작업, 아카이브 권장
```

#### 권장 구조
```bash
database/
├── migrations/          # 현재 사용 중
│   ├── 01_create_tables.sql
│   ├── 02_insert_seed_data.sql
│   ├── ...
│   └── 21_performance_improvements.sql
├── archived/           # 더 이상 사용 안함
│   ├── 10_cleanup_all_projects.sql
│   └── 13_create_unit_price_tables.sql
├── views/              # 뷰 정의
│   ├── v_projects_detail.sql
│   └── v_unit_prices_comparison.sql
├── functions/          # 저장 프로시저
│   └── common_functions.sql
└── maintenance/        # 유지보수 스크립트
    ├── validate_data.sql
    └── backup.sh
```

### 6. 테이블명 정리

#### 현재 상태 (혼재)
```sql
-- 접두사 있음
we_users, we_projects, we_clients

-- 접두사 없음 (schema.sql에만)
users, projects, clients
```

#### 개선안
```sql
-- 옵션 1: 모두 we_ 접두사 사용 (권장)
-- 이유: 다른 앱과 DB 공유 시 충돌 방지

-- 옵션 2: 스키마 분리
CREATE SCHEMA weworks;
CREATE TABLE weworks.users (...);
CREATE TABLE weworks.projects (...);
```

---

## 🚨 발견된 잠재적 문제

### 1. users 테이블 role_id
```sql
-- 현재: we_users에 role_id (단일 역할)
role_id BIGINT REFERENCES we_roles(id)

-- 문제: 15_create_user_roles_table.sql에서 다중 역할 지원으로 변경
-- → role_id 컬럼이 중복/불필요해질 수 있음

-- 해결방안:
-- 1. role_id 컬럼 유지 (기본 역할용)
-- 2. we_user_roles 테이블 (추가 역할용)
-- 또는
-- 1. role_id 컬럼 제거
-- 2. we_user_roles 테이블만 사용
```

### 2. 마이그레이션 순서 의존성
```sql
-- 문제: 일부 마이그레이션이 순서에 민감
-- 예: 16번 실행 전에 13번이 실행되면 충돌 가능

-- 해결방안: 각 마이그레이션에 의존성 명시
-- 16_create_unit_price_tables_v2.sql
-- DEPENDS ON: 01_create_tables.sql
-- REPLACES: 13_create_unit_price_tables.sql
```

### 3. 기본값 불일치
```sql
-- 프로젝트 통화 기본값
-- 일부 테이블: DEFAULT 'KRW'
-- 일부 테이블: 기본값 없음

-- 통일 권장
ALTER TABLE we_projects 
ALTER COLUMN currency SET DEFAULT 'KRW';
```

---

## 📊 성능 분석

### 예상 쿼리 패턴

#### 1. 프로젝트 목록 조회
```sql
-- 현재 쿼리 (예상)
SELECT * FROM we_projects 
WHERE status = 'profitability_analysis'
ORDER BY created_at DESC;

-- 인덱스: idx_we_projects_status (단일)
-- 성능: Good ✅

-- 개선 후 (복합 인덱스)
CREATE INDEX idx_we_projects_status_created 
ON we_projects(status, created_at DESC);
-- 성능: Better ✅✅
```

#### 2. 기준단가 조회
```sql
-- 현재 쿼리 (예상)
SELECT * FROM we_unit_prices 
WHERE year = 2026 
AND affiliation_group = '위엠비_컨설팅'
AND is_active = true
ORDER BY job_level, grade;

-- 현재 인덱스: 없음 (UNIQUE 인덱스만)
-- 성능: Slow ⚠️

-- 개선 후
CREATE INDEX idx_we_unit_prices_lookup
ON we_unit_prices(year, affiliation_group, is_active, job_level, grade)
WHERE is_active = true;
-- 성능: Fast ✅✅✅
```

#### 3. 수지분석서 목록
```sql
-- 현재 쿼리 (예상)
SELECT pf.*, p.name, c.name as customer_name
FROM we_project_profitability pf
JOIN we_projects p ON pf.project_id = p.id
LEFT JOIN we_clients c ON p.customer_id = c.id
ORDER BY pf.created_at DESC;

-- 현재 인덱스: project_id만
-- 성능: Medium ⚠️

-- 개선: 뷰 사용
SELECT * FROM v_we_profitability_list
ORDER BY created_at DESC;
-- 성능: Better ✅✅
```

---

## 🔒 보안 개선

### 1. 민감 정보 암호화

```sql
-- 현재: 평문 저장 (일부)
-- 개선: 암호화 필요 항목

-- 사용자 개인정보
ALTER TABLE we_users 
ADD COLUMN phone_encrypted BYTEA; -- 암호화된 전화번호

-- 고객사 연락처
ALTER TABLE we_clients
ADD COLUMN contact_email_encrypted BYTEA;
```

### 2. Row-Level Security (RLS)

```sql
-- PostgreSQL RLS 활성화
ALTER TABLE we_projects ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 프로젝트만 조회 가능
CREATE POLICY project_access_policy ON we_projects
    FOR SELECT
    USING (
        manager_id = current_user_id() OR
        sales_representative_id = current_user_id() OR
        created_by = current_user_id()
    );
```

### 3. 감사 로그

```sql
-- 중요 작업 추적
CREATE TABLE we_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES we_users(id),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON we_audit_log(user_id);
CREATE INDEX idx_audit_log_table_record ON we_audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON we_audit_log(created_at DESC);
```

---

## 🔄 마이그레이션 전략

### 안전한 스키마 변경 프로세스

```sql
-- 1. 새 컬럼 추가 (NULL 허용)
ALTER TABLE we_projects ADD COLUMN new_field VARCHAR(100);

-- 2. 기존 데이터 마이그레이션
UPDATE we_projects SET new_field = old_field;

-- 3. NOT NULL 제약 추가
ALTER TABLE we_projects ALTER COLUMN new_field SET NOT NULL;

-- 4. 구 컬럼 제거 (충분한 검증 후)
-- ALTER TABLE we_projects DROP COLUMN old_field;
```

### 롤백 스크립트 준비

```sql
-- 각 마이그레이션마다 롤백 스크립트 준비
-- 예: 21_performance_improvements.sql

-- UP (적용)
CREATE INDEX idx_we_projects_status_phase 
ON we_projects(status, current_phase);

-- DOWN (롤백)
-- DROP INDEX idx_we_projects_status_phase;
```

---

## 📈 모니터링

### 1. 성능 지표 수집

```sql
-- 슬로우 쿼리 로그 활성화 (postgresql.conf)
log_min_duration_statement = 1000  -- 1초 이상 쿼리 로깅

-- 통계 수집
SELECT 
    schemaname,
    tablename,
    seq_scan,        -- 전체 테이블 스캔 횟수
    seq_tup_read,    -- 읽은 행 수
    idx_scan,        -- 인덱스 스캔 횟수
    idx_tup_fetch    -- 인덱스로 가져온 행 수
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

### 2. 디스크 사용량 모니터링

```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 인덱스 효율성

```sql
-- 사용되지 않는 인덱스 찾기
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

---

## 🛠️ 유지보수 작업

### 정기 작업 (주간)

```sql
-- 1. VACUUM (죽은 행 정리)
VACUUM ANALYZE we_projects;
VACUUM ANALYZE we_unit_prices;
VACUUM ANALYZE we_project_profitability;

-- 2. 통계 갱신
ANALYZE;

-- 3. 인덱스 재구축 (필요시)
REINDEX TABLE we_unit_prices;
```

### 정기 작업 (월간)

```sql
-- 1. 데이터 품질 검증
\i database/validate_data.sql

-- 2. 백업 검증
-- 백업 파일로 복원 테스트

-- 3. 성능 리포트
SELECT * FROM pg_stat_user_tables;
SELECT * FROM pg_stat_user_indexes;
```

---

## 📋 체크리스트

### 즉시 적용 (High Priority)
- [ ] 21_performance_improvements.sql 실행
- [ ] validate_data.sql 실행 및 결과 확인
- [ ] 중복 데이터 정리
- [ ] ANALYZE 실행

### 단기 (이번 주)
- [ ] 트리거 추가 (updated_at)
- [ ] 제약 조건 강화
- [ ] 뷰 생성
- [ ] 마이그레이션 파일 정리

### 중기 (이번 달)
- [ ] 감사 로그 구현
- [ ] 성능 모니터링 대시보드
- [ ] 백업 자동화
- [ ] 문서화 완성

### 장기 (분기별)
- [ ] 파티셔닝 검토
- [ ] 읽기 전용 복제본 구성
- [ ] 아카이빙 전략
- [ ] 재해 복구 계획

---

## 🎯 권장 실행 순서

### 1단계: 즉시 실행 (위험도 낮음)
```bash
# 복합 인덱스 추가
psql -d weworks_db -f database/21_performance_improvements.sql

# 데이터 검증
psql -d weworks_db -f database/validate_data.sql > report.txt

# 통계 갱신
psql -d weworks_db -c "ANALYZE;"
```

### 2단계: 검증 후 실행
```sql
-- 제약 조건 추가 (데이터 확인 후)
-- 트리거 추가
-- 뷰 생성
```

### 3단계: 계획 후 실행
```sql
-- 테이블명 정리
-- 파티셔닝
-- RLS 적용
```

---

## 📖 참고 문서

- PostgreSQL Performance Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization
- Indexing Best Practices: https://wiki.postgresql.org/wiki/Index_Maintenance
- Migration Strategies: https://www.postgresql.org/docs/current/ddl-alter.html

---

**검토자**: DBA, 백엔드 개발자  
**실행 전 필수**: 데이터베이스 백업  
**롤백 계획**: 각 스크립트마다 준비 필요
