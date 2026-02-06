-- ============================================
-- 모든 프로젝트 및 관련 데이터 삭제 스크립트
-- 주의: 이 스크립트는 모든 프로젝트 데이터를 삭제합니다!
-- ============================================

-- 외래키 제약 조건 때문에 순서가 중요합니다
-- 자식 테이블부터 삭제해야 합니다

-- 1. M/D 산정 관련 데이터 삭제
DELETE FROM we_project_md_estimation_pid_items;
DELETE FROM we_project_md_estimation_modeling_3d_items;
DELETE FROM we_project_md_estimation_development_items;
DELETE FROM we_project_md_estimation_field_categories;
DELETE FROM we_project_md_estimation_difficulties;
DELETE FROM we_project_md_estimations;

-- 2. VRB Review 관련 데이터 삭제
DELETE FROM we_project_vrb_estimated_mm_items;
DELETE FROM we_project_vrb_project_costs;
DELETE FROM we_project_vrb_key_activities;
DELETE FROM we_project_vrb_key_contents;
DELETE FROM we_project_vrb_reviews;

-- 3. 프로젝트 삭제
DELETE FROM we_projects;

-- 시퀀스 리셋
ALTER SEQUENCE we_projects_id_seq RESTART WITH 1;
ALTER SEQUENCE we_project_md_estimations_id_seq RESTART WITH 1;
ALTER SEQUENCE we_project_vrb_reviews_id_seq RESTART WITH 1;

-- 확인용 쿼리
SELECT 
    (SELECT COUNT(*) FROM we_projects) as projects_count,
    (SELECT COUNT(*) FROM we_project_md_estimations) as md_estimations_count,
    (SELECT COUNT(*) FROM we_project_vrb_reviews) as vrb_reviews_count;
