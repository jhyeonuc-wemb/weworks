# ⚡ 데이터베이스 빠른 시작 가이드

## 🎯 **1단계: 어떤 테이블이 있는지 확인** (1분)

### pgAdmin에서 실행:

```sql
-- 필수 테이블 존재 확인
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
        THEN '✅ 있음'
        ELSE '❌ 없음'
    END as status
FROM (VALUES 
    ('we_users'),
    ('we_projects'),
    ('we_clients'),
    ('we_unit_prices'),
    ('we_products'),
    ('we_project_profitability'),
    ('we_project_profitability_standard_expenses'),
    ('we_project_vrb_reviews'),
    ('we_user_roles')
) AS t(table_name)
ORDER BY table_name;
```

---

## 🚀 **2단계: 없는 테이블 생성** (필요시)

### 만약 `we_user_roles`가 없다면:
```sql
-- 15_create_user_roles_table.sql 내용 실행
CREATE TABLE IF NOT EXISTS we_user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES we_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES we_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_we_user_roles_user_id ON we_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_we_user_roles_role_id ON we_user_roles(role_id);
```

### 만약 `we_unit_prices`가 없다면:
- 파일 열기: `database/16_create_unit_price_tables_v2.sql`
- 전체 복사해서 pgAdmin에 붙여넣고 실행
- 그 다음: `database/17_insert_unit_price_initial_data.sql` 실행

### 만약 `we_products`가 없다면:
- 파일 열기: `database/20_create_product_master_tables.sql`
- 전체 복사해서 pgAdmin에 붙여넣고 실행

### 만약 `we_project_profitability`가 없다면:
- 파일 열기: `database/19_create_profitability_tables.sql`
- 전체 복사해서 pgAdmin에 붙여넣고 실행

---

## ⚡ **3단계: 성능 개선 스크립트 실행** (1분)

### 이제 안전하게 실행 가능! ✅

```
파일: database/21_performance_improvements.sql

방법:
1. pgAdmin > weworks_db 선택
2. Query Tool 열기 (Tools > Query Tool)
3. 파일 열기 또는 내용 복사
4. F5 또는 ▶ 버튼 클릭
```

### 수정 내용:
- ✅ 테이블이 없어도 에러 나지 않음
- ✅ 안전하게 실행 가능
- ✅ 이미 생성된 인덱스/뷰는 재생성

---

## ✅ **성공 메시지**

실행 후 이런 메시지들이 보이면 성공:

```
DO
DO
DO
DO
DO
CREATE FUNCTION (또는 이미 존재)
DO (여러 개)
DO
COMMENT (여러 개)
```

### 에러가 없으면 성공! ✅

---

## 🔍 **4단계: 확인** (1분)

```sql
-- 생성된 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_we_%'
ORDER BY tablename;

-- 생성된 뷰 확인
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_we_%';

-- 생성된 트리거 확인
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'update_%'
ORDER BY event_object_table;
```

---

## 📋 **전체 실행 순서 요약**

```
1단계: 테이블 확인 (위 쿼리 실행)
         ↓
2단계: 없는 테이블 생성 (필요시)
         ↓
3단계: 21_performance_improvements.sql 실행 ⭐
         ↓
4단계: 결과 확인 (위 쿼리 실행)
         ↓
완료! 🎉
```

---

## 🚨 **가장 간단한 방법**

### 모든 테이블이 있는지 확실하지 않다면:

```sql
-- 1. 이것만 실행하세요:
-- database/21_performance_improvements.sql (수정됨)

-- 이제 테이블이 없어도 에러 없이 실행됩니다!
-- 있는 테이블에만 인덱스/뷰/트리거가 추가됩니다.
```

---

## 💡 **팁**

### pgAdmin에서 파일 직접 열기
```
메뉴: File > Open
경로: C:\Users\hyeonuc\weworks\database\21_performance_improvements.sql
선택 후 F5
```

### 또는 복사/붙여넣기
```
1. VS Code에서 21_performance_improvements.sql 열기
2. Ctrl+A (전체 선택)
3. Ctrl+C (복사)
4. pgAdmin Query Tool에 Ctrl+V (붙여넣기)
5. F5 (실행)
```

---

**준비 완료!** 이제 안전하게 실행 가능합니다! 🚀
