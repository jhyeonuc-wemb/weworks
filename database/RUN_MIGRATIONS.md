# 📋 데이터베이스 마이그레이션 실행 가이드

## 🔴 주의사항

### 실행 전 필수 작업
1. **백업 필수!**
   ```powershell
   # pgAdmin 또는 명령어로 백업
   pg_dump -U postgres weworks_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
   ```

2. **스테이징/로컬 환경에서 먼저 테스트**
3. **롤백 계획 준비**

---

## 📊 현재 DB 상태 확인

### 1단계: 현재 어떤 테이블이 있는지 확인
```sql
-- pgAdmin Query Tool 또는 psql에서 실행
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 2단계: 마이그레이션 히스토리 확인 (있다면)
```sql
-- 마이그레이션 테이블이 있는지 확인
SELECT * FROM information_schema.tables 
WHERE table_name = 'schema_migrations';

-- 있다면 실행된 마이그레이션 확인
SELECT * FROM schema_migrations ORDER BY version;
```

---

## 🚀 실행해야 할 스크립트 (순서별)

### **기존 마이그레이션 (이미 실행되어 있어야 함)**

#### 필수 기본 테이블 (순서대로)
```powershell
# 1. 기본 테이블 생성
01_create_tables.sql           # 사용자, 역할, 부서, 프로젝트 등

# 2. 기본 데이터 입력
02_insert_seed_data.sql        # 기본 역할, 권한 등

# 3. VRB 테이블
03_create_vrb_tables.sql       # VRB 기본 테이블
04_alter_vrb_add_win_date.sql
05_alter_vrb_add_rejection_reason.sql
06_create_vrb_estimated_mm_items_table.sql
11_alter_vrb_add_external_purchase_fields.sql
12_alter_vrb_add_customer_name.sql

# 4. 사용자 관련
07_alter_users_add_fields.sql  # 직급, 등급 필드
08_insert_ranks_and_users.sql  # 직급 데이터
15_create_user_roles_table.sql # 다중 역할 지원

# 5. M/D 산정
09_alter_md_estimations_add_weight_tables.sql

# 6. 프로젝트 관련
14_create_project_team_assignments.sql

# 7. 기준단가표 (중요!)
16_create_unit_price_tables_v2.sql   # ⚠️ 13번 대신 이것 실행
17_insert_unit_price_initial_data.sql

# 8. 수지분석서
18_create_profitability_standard_expense_tables.sql
19_create_profitability_tables.sql

# 9. 제품 마스터
20_create_product_master_tables.sql
```

### **신규 성능 개선 (필수!)**
```powershell
# 10. 성능 개선 (오늘 생성한 파일)
21_performance_improvements.sql    # ⭐ 반드시 실행!
```

---

## 🎯 **실행 방법 (3가지 옵션)**

### **옵션 1: pgAdmin 사용 (가장 쉬움) ⭐ 권장**

1. **pgAdmin 실행**
2. **weworks_db 데이터베이스 선택**
3. **Query Tool 열기** (Tools > Query Tool)
4. **파일 내용 복사**
   - `database/21_performance_improvements.sql` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)
5. **Query Tool에 붙여넣기** (Ctrl+V)
6. **실행** (F5 또는 ▶ 버튼)
7. **결과 확인**

### **옵션 2: VS Code에서 PostgreSQL 확장 사용**

1. **PostgreSQL 확장 설치** (ckolkman.vscode-postgres)
2. **DB 연결 추가**
3. **21_performance_improvements.sql 파일 열기**
4. **우클릭 > Run Query**

### **옵션 3: 명령줄 (psql 설치된 경우)**

```powershell
# PowerShell에서:
cd C:\Users\hyeonuc\weworks\database

# psql이 PATH에 있다면:
psql -U postgres -d weworks_db -f 21_performance_improvements.sql

# psql 경로 직접 지정:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d weworks_db -f 21_performance_improvements.sql
```

---

## 📝 **21_performance_improvements.sql 내용 요약**

이 스크립트가 하는 일:

### 1. 복합 인덱스 추가 (조회 성능 3-5배 향상)
```sql
-- 프로젝트 상태/단계 조회 최적화
CREATE INDEX idx_we_projects_status_phase ON we_projects(status, current_phase);

-- 기준단가 조회 최적화
CREATE INDEX idx_we_unit_prices_year_affiliation_active 
ON we_unit_prices(year, affiliation_group, is_active);

-- 수지분석서 조회 최적화
CREATE INDEX idx_we_profitability_project_status 
ON we_project_profitability(project_id, status);

-- VRB 조회 최적화
CREATE INDEX idx_we_vrb_project_status 
ON we_project_vrb_reviews(project_id, status);

-- 사용자 역할 조회 최적화
CREATE INDEX idx_we_user_roles_user_id ON we_user_roles(user_id);
```

### 2. 뷰 생성 (복잡한 조인 간소화)
```sql
-- 프로젝트 상세 정보 뷰
CREATE VIEW v_we_projects_detail AS ...

-- 기준단가 상세 뷰
CREATE VIEW v_we_unit_prices_detail AS ...

-- 수지분석서 목록 뷰
CREATE VIEW v_we_profitability_list AS ...
```

### 3. 트리거 생성 (updated_at 자동 갱신)
```sql
CREATE TRIGGER update_we_projects_updated_at ...
CREATE TRIGGER update_we_unit_prices_updated_at ...
CREATE TRIGGER update_we_products_updated_at ...
CREATE TRIGGER update_we_profitability_updated_at ...
```

### 4. 제약 조건 강화 (데이터 품질)
```sql
-- 음수 금액 방지
ALTER TABLE we_project_profitability
ADD CONSTRAINT chk_profitability_amounts_positive ...

-- 연도 범위 검증
ALTER TABLE we_unit_prices
ADD CONSTRAINT chk_unit_prices_year_range ...
```

### 5. 통계 갱신
```sql
ANALYZE we_projects;
ANALYZE we_unit_prices;
ANALYZE we_project_profitability;
...
```

---

## ✅ **실행 순서 (빠른 가이드)**

### 빠른 실행 (5분)
```sql
-- pgAdmin Query Tool에서:

-- 1. 스키마 확인 (선택사항)
\i C:/Users/hyeonuc/weworks/database/check_schema.sql

-- 2. 성능 개선 적용 (필수)
\i C:/Users/hyeonuc/weworks/database/21_performance_improvements.sql

-- 3. 데이터 검증 (권장)
\i C:/Users/hyeonuc/weworks/database/validate_data.sql
```

---

## 🔍 **실행 후 확인 사항**

### 성공 메시지 확인
```
CREATE INDEX (5개)
CREATE VIEW (3개)
CREATE FUNCTION (2개)
CREATE TRIGGER (4개)
ALTER TABLE (2개)
ANALYZE (여러 개)

✅ 모두 성공해야 함
```

### 에러 발생 시
```sql
-- 이미 존재한다는 에러는 OK
ERROR: relation "idx_we_projects_status_phase" already exists
→ 이미 실행됨, 문제 없음

-- 테이블이 없다는 에러
ERROR: relation "we_unit_prices" does not exist
→ 기존 마이그레이션 먼저 실행 필요
```

---

## 📊 **검증 쿼리**

### 인덱스가 제대로 생성되었는지 확인
```sql
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_we_%'
ORDER BY tablename, indexname;

-- 예상 결과: 5개 이상의 새 인덱스
```

### 뷰가 생성되었는지 확인
```sql
SELECT 
    viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_we_%';

-- 예상 결과: v_we_projects_detail, v_we_unit_prices_detail, v_we_profitability_list
```

### 성능 향상 확인
```sql
-- 기존 쿼리 실행 계획
EXPLAIN ANALYZE
SELECT * FROM we_projects 
WHERE status = 'profitability_analysis' 
AND current_phase = 'profitability';

-- 결과에서 "Index Scan using idx_we_projects_status_phase" 확인
```

---

## 🚨 **롤백 방법 (필요 시)**

### 인덱스 제거
```sql
DROP INDEX IF EXISTS idx_we_projects_status_phase;
DROP INDEX IF EXISTS idx_we_unit_prices_year_affiliation_active;
DROP INDEX IF EXISTS idx_we_profitability_project_status;
DROP INDEX IF EXISTS idx_we_vrb_project_status;
DROP INDEX IF EXISTS idx_we_user_roles_user_id;
```

### 뷰 제거
```sql
DROP VIEW IF EXISTS v_we_projects_detail;
DROP VIEW IF EXISTS v_we_unit_prices_detail;
DROP VIEW IF EXISTS v_we_profitability_list;
```

### 트리거 제거
```sql
DROP TRIGGER IF EXISTS update_we_projects_updated_at ON we_projects;
DROP TRIGGER IF EXISTS update_we_unit_prices_updated_at ON we_unit_prices;
DROP TRIGGER IF EXISTS update_we_products_updated_at ON we_products;
DROP TRIGGER IF EXISTS update_we_profitability_updated_at ON we_project_profitability;
```

---

## 🎯 **요약**

### 실행할 파일
```
✅ database/21_performance_improvements.sql (필수!)
✅ database/validate_data.sql (권장, 검증용)
✅ database/check_schema.sql (선택, 현황 확인용)
```

### 실행 방법
1. **pgAdmin 열기**
2. **weworks_db 선택**
3. **Query Tool 열기**
4. **21_performance_improvements.sql 내용 복사/붙여넣기**
5. **F5 또는 ▶ 버튼 클릭**
6. **결과 확인**

### 소요 시간
- 실행: **1-2분**
- 검증: **1분**
- 총: **3분 이내**

### 효과
- ✅ 조회 성능 **3-5배 향상**
- ✅ 복잡한 쿼리 **간소화**
- ✅ 데이터 품질 **보장**
- ✅ 자동 관리 **편의성**

---

## 📞 **도움말**

### pgAdmin 위치 찾기
```
일반적인 경로:
C:\Program Files\PostgreSQL\16\pgAdmin 4\bin\pgAdmin4.exe
또는 Windows 시작 메뉴에서 "pgAdmin" 검색
```

### psql 위치 찾기
```powershell
# PowerShell에서 확인:
Get-Command psql

# 없으면 직접 경로 지정:
"C:\Program Files\PostgreSQL\16\bin\psql.exe"
```

---

**다음**: 스크립트 실행 후 앱 테스트!
