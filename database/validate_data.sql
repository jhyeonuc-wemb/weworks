-- 데이터 정합성 검증 쿼리
-- 이 스크립트는 데이터베이스의 데이터 품질을 확인합니다

-- ============================================
-- 1. 외래키 무결성 검증
-- ============================================

-- 프로젝트의 고객사가 존재하지 않는 경우
SELECT 
    'projects_missing_customer' as issue,
    COUNT(*) as count
FROM we_projects 
WHERE customer_id IS NOT NULL 
AND customer_id NOT IN (SELECT id FROM we_clients);

-- 프로젝트의 담당자가 존재하지 않는 경우
SELECT 
    'projects_missing_manager' as issue,
    COUNT(*) as count
FROM we_projects 
WHERE manager_id IS NOT NULL 
AND manager_id NOT IN (SELECT id FROM we_users);

-- 수지분석서의 프로젝트가 존재하지 않는 경우
SELECT 
    'profitability_without_project' as issue,
    COUNT(*) as count
FROM we_project_profitability pf
WHERE NOT EXISTS (
    SELECT 1 FROM we_projects p WHERE p.id = pf.project_id
);

-- VRB의 프로젝트가 존재하지 않는 경우
SELECT 
    'vrb_without_project' as issue,
    COUNT(*) as count
FROM we_project_vrb_reviews v
WHERE NOT EXISTS (
    SELECT 1 FROM we_projects p WHERE p.id = v.project_id
);

-- ============================================
-- 2. 중복 데이터 검증
-- ============================================

-- 기준단가 중복 체크
SELECT 
    'duplicate_unit_prices' as issue,
    affiliation_group, 
    job_group, 
    job_level, 
    grade, 
    year, 
    COUNT(*) as duplicate_count
FROM we_unit_prices 
GROUP BY affiliation_group, job_group, job_level, grade, year 
HAVING COUNT(*) > 1;

-- 제품 마스터 중복 체크
SELECT 
    'duplicate_products' as issue,
    company_name,
    product_name,
    COUNT(*) as duplicate_count
FROM we_products
GROUP BY company_name, product_name
HAVING COUNT(*) > 1;

-- 사용자 이메일 중복 체크
SELECT 
    'duplicate_user_emails' as issue,
    email,
    COUNT(*) as duplicate_count
FROM we_users
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================
-- 3. 데이터 품질 검증
-- ============================================

-- 음수 금액 체크
SELECT 
    'negative_profitability_amounts' as issue,
    id,
    project_id,
    total_revenue,
    total_cost
FROM we_project_profitability
WHERE total_revenue < 0 OR total_cost < 0;

-- 비정상적인 연도 체크 (2020년 이전, 2100년 이후)
SELECT 
    'invalid_year_unit_prices' as issue,
    id,
    year
FROM we_unit_prices
WHERE year < 2020 OR year > 2100;

-- 계약 종료일이 시작일보다 빠른 경우
SELECT 
    'invalid_project_dates' as issue,
    id,
    name,
    contract_start_date,
    contract_end_date
FROM we_projects
WHERE contract_start_date IS NOT NULL 
AND contract_end_date IS NOT NULL
AND contract_end_date < contract_start_date;

-- NULL이면 안되는 필드에 NULL이 있는 경우
SELECT 
    'projects_missing_name' as issue,
    COUNT(*) as count
FROM we_projects
WHERE name IS NULL OR name = '';

-- ============================================
-- 4. 비즈니스 로직 검증
-- ============================================

-- 승인된 VRB가 있는데 프로젝트 상태가 잘못된 경우
SELECT 
    'vrb_approved_wrong_project_status' as issue,
    p.id,
    p.name,
    p.status,
    v.status as vrb_status
FROM we_projects p
INNER JOIN we_project_vrb_reviews v ON p.id = v.project_id
WHERE v.status = 'approved'
AND p.status NOT IN ('vrb_approved', 'profitability_analysis', 'profitability_completed', 'in_progress');

-- 수지분석서가 여러 버전인데 completed가 여러 개인 경우 (이상)
SELECT 
    'multiple_completed_profitability' as issue,
    project_id,
    COUNT(*) as completed_count
FROM we_project_profitability
WHERE status = 'completed'
GROUP BY project_id
HAVING COUNT(*) > 1;

-- ============================================
-- 5. 성능 관련 통계
-- ============================================

-- 테이블별 레코드 수
SELECT 
    'table_row_count' as metric,
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 인덱스 사용률
SELECT 
    'index_usage' as metric,
    schemaname,
    tablename,
    indexname,
    idx_scan as scan_count,
    idx_tup_read as rows_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- 테이블 크기
SELECT 
    'table_size' as metric,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 6. 데이터 완성도 검증
-- ============================================

-- 프로젝트별 데이터 완성도
SELECT 
    p.id,
    p.name,
    p.status,
    CASE WHEN v.id IS NOT NULL THEN 'O' ELSE 'X' END as has_vrb,
    CASE WHEN pf.id IS NOT NULL THEN 'O' ELSE 'X' END as has_profitability,
    CASE WHEN p.contract_start_date IS NOT NULL THEN 'O' ELSE 'X' END as has_start_date,
    CASE WHEN p.customer_id IS NOT NULL THEN 'O' ELSE 'X' END as has_customer
FROM we_projects p
LEFT JOIN we_project_vrb_reviews v ON p.id = v.project_id
LEFT JOIN we_project_profitability pf ON p.id = pf.project_id
ORDER BY p.created_at DESC
LIMIT 20;

-- ============================================
-- 7. 마스터 데이터 완성도
-- ============================================

-- 연도별 기준단가 커버리지
SELECT 
    year,
    COUNT(*) as total_records,
    COUNT(DISTINCT affiliation_group) as affiliation_count,
    COUNT(DISTINCT job_group) as job_group_count,
    COUNT(DISTINCT job_level) as job_level_count
FROM we_unit_prices
WHERE is_active = true
GROUP BY year
ORDER BY year DESC;

-- 제품 마스터 상태
SELECT 
    'product_master_stats' as metric,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(DISTINCT company_name) as unique_companies
FROM we_products;

-- ============================================
-- 8. 권장 조치
-- ============================================

-- 사용하지 않는 인덱스 제거 후보
SELECT 
    schemaname,
    tablename,
    indexname,
    'DROP INDEX ' || schemaname || '.' || indexname || ';' as drop_statement
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public'
AND indexname NOT LIKE '%_pkey';

-- VACUUM 필요 테이블
SELECT 
    schemaname,
    tablename,
    n_dead_tup as dead_tuples,
    'VACUUM ANALYZE ' || schemaname || '.' || tablename || ';' as vacuum_statement
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
