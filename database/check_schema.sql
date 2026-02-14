-- 데이터베이스 스키마 현황 확인 스크립트

-- ============================================
-- 1. 전체 테이블 목록
-- ============================================

SELECT 
    'tables' as category,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 2. 인덱스 현황
-- ============================================

SELECT 
    'indexes' as category,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 3. 외래키 제약 조건
-- ============================================

SELECT
    'foreign_keys' as category,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 4. CHECK 제약 조건
-- ============================================

SELECT
    'check_constraints' as category,
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

-- ============================================
-- 5. 뷰 목록
-- ============================================

SELECT 
    'views' as category,
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- ============================================
-- 6. 트리거 목록
-- ============================================

SELECT 
    'triggers' as category,
    trigger_schema,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 7. 함수 목록
-- ============================================

SELECT 
    'functions' as category,
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================
-- 8. 테이블별 통계
-- ============================================

SELECT 
    'table_stats' as category,
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================
-- 9. 인덱스 사용 통계
-- ============================================

SELECT 
    'index_stats' as category,
    schemaname,
    tablename,
    indexname,
    idx_scan as scan_count,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- 10. 필수 테이블 존재 확인
-- ============================================

SELECT 
    'required_tables' as category,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
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

-- ============================================
-- 11. 필수 인덱스 존재 확인
-- ============================================

SELECT 
    'required_indexes' as category,
    index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = i.index_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('idx_we_projects_status'),
        ('idx_we_unit_prices_year'),
        ('idx_we_profitability_project_id'),
        ('idx_we_user_roles_user_id')
) AS i(index_name)
ORDER BY index_name;
