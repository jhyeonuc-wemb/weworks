-- ============================================
-- WEWORKS 데이터베이스 전체 삭제 스크립트
-- 주의: 이 스크립트는 모든 테이블과 데이터를 삭제합니다!
-- 실행 순서: 00_drop_all_tables.sql -> 01_create_tables.sql -> 02_insert_seed_data.sql
-- ============================================

-- 외래키 제약조건 때문에 자식 테이블부터 삭제해야 합니다.

-- ============================================
-- 1. 프로젝트 M/D 산정 테이블 삭제 (자식 테이블)
-- ============================================
DROP TABLE IF EXISTS we_project_md_estimation_pid_items CASCADE;
DROP TABLE IF EXISTS we_project_md_estimation_modeling_3d_items CASCADE;
DROP TABLE IF EXISTS we_project_md_estimation_development_items CASCADE;
DROP TABLE IF EXISTS we_project_md_estimation_field_categories CASCADE;
DROP TABLE IF EXISTS we_project_md_estimation_difficulties CASCADE;
DROP TABLE IF EXISTS we_project_md_estimations CASCADE;

-- ============================================
-- 2. 프로젝트 테이블 삭제
-- ============================================
DROP TABLE IF EXISTS we_projects CASCADE;

-- ============================================
-- 3. 기준 데이터 테이블 삭제
-- ============================================
DROP TABLE IF EXISTS we_md_pid_weights CASCADE;
DROP TABLE IF EXISTS we_md_pid_items CASCADE;
DROP TABLE IF EXISTS we_md_modeling_3d_weights CASCADE;
DROP TABLE IF EXISTS we_md_modeling_3d_items CASCADE;
DROP TABLE IF EXISTS we_md_development_items CASCADE;
DROP TABLE IF EXISTS we_md_field_difficulty_items CASCADE;
DROP TABLE IF EXISTS we_md_difficulty_items CASCADE;
DROP TABLE IF EXISTS we_labor_categories CASCADE;
DROP TABLE IF EXISTS we_project_categories CASCADE;

-- ============================================
-- 4. 기본 테이블 삭제 (순서 중요!)
-- ============================================
-- role_permissions는 roles를 참조하므로 먼저 삭제
DROP TABLE IF EXISTS we_role_permissions CASCADE;

-- users는 departments와 roles를 참조하므로 나중에 삭제
-- departments는 users를 참조하므로 순환 참조 해결 필요
-- 먼저 departments의 manager_id 외래키 제약조건 제거 (알림 없이)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'we_departments_manager_id_fkey' 
        AND table_name = 'we_departments'
    ) THEN
        ALTER TABLE we_departments DROP CONSTRAINT we_departments_manager_id_fkey;
    END IF;
END $$;

-- 이제 테이블 삭제
DROP TABLE IF EXISTS we_users CASCADE;
DROP TABLE IF EXISTS we_departments CASCADE;
DROP TABLE IF EXISTS we_clients CASCADE;
DROP TABLE IF EXISTS we_roles CASCADE;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '모든 테이블이 삭제되었습니다. 이제 01_create_tables.sql을 실행하세요.';
END $$;
