-- ============================================
-- 데이터베이스 마이그레이션 실행 순서
-- 모든 스크립트를 순서대로 실행하세요
-- ============================================

-- ============================================
-- 먼저 확인: 어떤 테이블이 이미 있는지 체크
-- ============================================

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
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

-- ============================================
-- 위 결과를 보고 필요한 마이그레이션 실행
-- ============================================

-- 만약 we_user_roles가 MISSING이라면:
-- \i C:/Users/hyeonuc/weworks/database/15_create_user_roles_table.sql

-- 만약 we_unit_prices가 MISSING이라면:
-- \i C:/Users/hyeonuc/weworks/database/16_create_unit_price_tables_v2.sql
-- \i C:/Users/hyeonuc/weworks/database/17_insert_unit_price_initial_data.sql

-- 만약 we_project_profitability가 MISSING이라면:
-- \i C:/Users/hyeonuc/weworks/database/18_create_profitability_standard_expense_tables.sql
-- \i C:/Users/hyeonuc/weworks/database/19_create_profitability_tables.sql

-- 만약 we_products가 MISSING이라면:
-- \i C:/Users/hyeonuc/weworks/database/20_create_product_master_tables.sql

-- ============================================
-- 모든 필수 테이블이 있으면 성능 개선 실행
-- ============================================

-- \i C:/Users/hyeonuc/weworks/database/21_performance_improvements.sql
