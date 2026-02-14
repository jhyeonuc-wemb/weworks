# 데이터베이스 개선 제안

## 📊 현재 상태 분석

### ✅ 잘 되어 있는 부분
1. **인덱스 관리**: 주요 컬럼에 인덱스가 잘 설정되어 있음
2. **외래키 제약**: 데이터 무결성을 위한 외래키가 적절히 설정됨
3. **타입스탬프**: created_at, updated_at이 모든 테이블에 존재
4. **CASCADE 처리**: ON DELETE CASCADE가 적절히 설정됨

## 🔧 개선 필요 사항

### 1. **마이그레이션 파일 정리**

현재 20개의 마이그레이션 파일이 있지만, 일부는 중복되거나 대체되었습니다:

#### 제거 가능한 파일:
- `13_create_unit_price_tables.sql` → `16_create_unit_price_tables_v2.sql`로 대체됨
- `10_cleanup_all_projects.sql` → 일회성 작업, 아카이브 가능

#### 권장사항:
```bash
# 마이그레이션 파일 정리
database/
  migrations/
    archived/  # 사용하지 않는 마이그레이션
      - 13_create_unit_price_tables.sql
      - 10_cleanup_all_projects.sql
    active/    # 현재 사용 중인 마이그레이션
      - 00_drop_all_tables.sql
      - 01_create_tables.sql
      ... (나머지)
```

### 2. **인덱스 최적화**

#### 복합 인덱스 추가 필요:

```sql
-- 프로젝트 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_projects_status_phase 
ON projects(status, current_phase);

-- 단가 조회 최적화 (연도 + 소속 + 활성 여부)
CREATE INDEX IF NOT EXISTS idx_unit_prices_year_affiliation_active
ON we_unit_prices(year, affiliation_group, is_active);

-- 수지분석서 조회 최적화
CREATE INDEX IF NOT EXISTS idx_profitability_project_status
ON we_project_profitability(project_id, status);

-- VRB 조회 최적화
CREATE INDEX IF NOT EXISTS idx_vrb_project_status
ON we_project_vrb_reviews(project_id, status);
```

### 3. **테이블 명명 규칙 통일**

현재 혼재된 네이밍:
- `users`, `projects` (snake_case, 단수/복수 혼재)
- `we_unit_prices`, `we_products` (접두사 `we_` 사용)
- `project_md_estimations` (명확한 접두사)

#### 권장 규칙:
```sql
-- 옵션 1: 모두 복수형, 접두사 없음
users, projects, unit_prices, products

-- 옵션 2: 도메인별 접두사 사용 (현재 추천)
we_users, we_projects, we_unit_prices, we_products
we_project_md_estimations → we_md_estimations
```

### 4. **기본값 및 제약 조건 개선**

```sql
-- 통화 기본값 명시
ALTER TABLE we_projects 
ALTER COLUMN currency SET DEFAULT 'KRW';

-- 상태값 NOT NULL 처리 (현재 일부만 적용)
ALTER TABLE we_project_profitability
ALTER COLUMN status SET NOT NULL;

-- 삭제된 레코드 대응 (Soft Delete)
ALTER TABLE we_projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE we_unit_prices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX idx_projects_deleted_at ON we_projects(deleted_at) 
WHERE deleted_at IS NULL;
```

### 5. **감사(Audit) 로그 개선**

현재는 created_by만 있는 경우가 많음:

```sql
-- 모든 주요 테이블에 감사 필드 추가
ALTER TABLE we_unit_prices 
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES we_users(id),
ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES we_users(id);

ALTER TABLE we_products
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES we_users(id),
ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES we_users(id);
```

### 6. **파티셔닝 고려 (대용량 데이터 대비)**

프로젝트가 많아질 경우를 대비:

```sql
-- 연도별 파티셔닝 (PostgreSQL 10+)
CREATE TABLE we_unit_prices_partitioned (
    LIKE we_unit_prices INCLUDING ALL
) PARTITION BY RANGE (year);

-- 각 연도별 파티션 생성
CREATE TABLE we_unit_prices_2024 
PARTITION OF we_unit_prices_partitioned
FOR VALUES FROM (2024) TO (2025);

CREATE TABLE we_unit_prices_2025 
PARTITION OF we_unit_prices_partitioned
FOR VALUES FROM (2025) TO (2026);
```

### 7. **뷰(View) 생성으로 복잡한 조인 간소화**

```sql
-- 프로젝트 상세 정보 뷰
CREATE OR REPLACE VIEW v_projects_detail AS
SELECT 
    p.*,
    c.name as customer_name,
    o.name as orderer_name,
    m.name as manager_name,
    s.name as sales_rep_name,
    cat.name as category_name
FROM we_projects p
LEFT JOIN we_clients c ON p.customer_id = c.id
LEFT JOIN we_clients o ON p.orderer_id = o.id
LEFT JOIN we_users m ON p.manager_id = m.id
LEFT JOIN we_users s ON p.sales_representative_id = s.id
LEFT JOIN we_project_categories cat ON p.category_id = cat.id;

-- 기준단가 상세 뷰 (정렬 포함)
CREATE OR REPLACE VIEW v_unit_prices_detail AS
SELECT 
    up.*,
    LAG(up.internal_applied) OVER (
        PARTITION BY up.affiliation_group, up.job_group, up.job_level, up.grade 
        ORDER BY up.year
    ) as prev_year_internal_applied
FROM we_unit_prices up
WHERE up.is_active = true
ORDER BY up.year DESC, up.affiliation_group, up.job_group;
```

### 8. **데이터 정합성 검증 쿼리**

```sql
-- 정기 실행용 검증 쿼리

-- 1. 외래키 무결성 체크
SELECT 'projects without customer' as issue, COUNT(*) 
FROM we_projects 
WHERE customer_id IS NOT NULL 
AND customer_id NOT IN (SELECT id FROM we_clients);

-- 2. 중복 데이터 체크
SELECT affiliation_group, job_group, job_level, grade, year, COUNT(*) 
FROM we_unit_prices 
GROUP BY affiliation_group, job_group, job_level, grade, year 
HAVING COUNT(*) > 1;

-- 3. 고아 레코드 체크
SELECT 'profitability without project' as issue, COUNT(*)
FROM we_project_profitability p
WHERE NOT EXISTS (
    SELECT 1 FROM we_projects pr WHERE pr.id = p.project_id
);
```

### 9. **성능 모니터링**

```sql
-- 느린 쿼리 확인 (PostgreSQL)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### 10. **백업 및 복구 전략**

```bash
# 정기 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/weworks"

# 전체 백업
pg_dump weworks_db > "$BACKUP_DIR/full_backup_$DATE.sql"

# 중요 테이블만 백업
pg_dump weworks_db \
  -t we_projects \
  -t we_project_profitability \
  -t we_project_vrb_reviews \
  > "$BACKUP_DIR/critical_tables_$DATE.sql"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

## 📋 우선순위

### 높음 (즉시 적용)
1. ✅ 복합 인덱스 추가 (2번)
2. ✅ 기본값 및 NOT NULL 제약 (4번)
3. ✅ 뷰 생성 (7번)

### 중간 (다음 스프린트)
4. ✅ 감사 필드 추가 (5번)
5. ✅ 데이터 검증 쿼리 실행 (8번)
6. ✅ 마이그레이션 파일 정리 (1번)

### 낮음 (장기 계획)
7. ✅ 테이블 네이밍 통일 (3번)
8. ✅ 파티셔닝 구현 (6번)
9. ✅ Soft Delete 구현 (4번)

## 🚀 즉시 적용 가능한 SQL

아래 SQL을 실행하면 즉시 성능 향상을 경험할 수 있습니다:

```sql
-- 1. 복합 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_projects_status_phase ON we_projects(status, current_phase);
CREATE INDEX IF NOT EXISTS idx_unit_prices_year_affiliation_active ON we_unit_prices(year, affiliation_group, is_active);
CREATE INDEX IF NOT EXISTS idx_profitability_project_status ON we_project_profitability(project_id, status);

-- 2. 뷰 생성
CREATE OR REPLACE VIEW v_projects_detail AS
SELECT 
    p.*,
    c.name as customer_name,
    o.name as orderer_name,
    m.name as manager_name
FROM we_projects p
LEFT JOIN we_clients c ON p.customer_id = c.id
LEFT JOIN we_clients o ON p.orderer_id = o.id
LEFT JOIN we_users m ON p.manager_id = m.id;

-- 3. ANALYZE 실행 (통계 갱신)
ANALYZE we_projects;
ANALYZE we_unit_prices;
ANALYZE we_project_profitability;
```
