-- ============================================
-- 직급 데이터 삽입 (순서: 사원>책임(A)>책임(M)>수석(S)>수석(L)>이사>상무>전무>대표이사)
-- ============================================
INSERT INTO we_ranks (code, name, display_order, description, is_active) VALUES
('staff', '사원', 1, '사원', true),
('senior_a', '책임(A)', 2, '책임(A)', true),
('senior_m', '책임(M)', 3, '책임(M)', true),
('principal_s', '수석(S)', 4, '수석(S)', true),
('principal_l', '수석(L)', 5, '수석(L)', true),
('director', '이사', 6, '이사', true),
('managing_director', '상무', 7, '상무', true),
('senior_managing_director', '전무', 8, '전무', true),
('ceo', '대표이사', 9, '대표이사', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 부서 데이터 삽입 (계층 구조)
-- ============================================
-- 1. 사업본부
DO $$
DECLARE
    v_business_division_id BIGINT;
    v_tech_group_id BIGINT;
    v_dev_team_id BIGINT;
BEGIN
    -- 사업본부
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('사업본부', NULL, '사업본부')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_business_division_id;
    
    -- 기존에 있으면 ID 가져오기
    IF v_business_division_id IS NULL THEN
        SELECT id INTO v_business_division_id FROM we_departments WHERE name = '사업본부';
    END IF;

    -- 2. 기술그룹 (사업본부 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('기술그룹', v_business_division_id, '기술그룹')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_tech_group_id;
    
    IF v_tech_group_id IS NULL THEN
        SELECT id INTO v_tech_group_id FROM we_departments WHERE name = '기술그룹';
    END IF;

    -- 3. PMO팀 (기술그룹 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('PMO팀', v_tech_group_id, 'PMO팀')
    ON CONFLICT (name) DO NOTHING;

    -- 4. 개발팀 (기술그룹 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('개발팀', v_tech_group_id, '개발팀')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_dev_team_id;
    
    IF v_dev_team_id IS NULL THEN
        SELECT id INTO v_dev_team_id FROM we_departments WHERE name = '개발팀';
    END IF;

    -- 5. 개발 1파트 (개발팀 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('개발 1파트', v_dev_team_id, '개발 1파트')
    ON CONFLICT (name) DO NOTHING;

    -- 6. 개발 2파트 (개발팀 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('개발 2파트', v_dev_team_id, '개발 2파트')
    ON CONFLICT (name) DO NOTHING;

    -- 7. 개발 3파트 (개발팀 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('개발 3파트', v_dev_team_id, '개발 3파트')
    ON CONFLICT (name) DO NOTHING;

    -- 8. 디자인팀 (기술그룹 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('디자인팀', v_tech_group_id, '디자인팀')
    ON CONFLICT (name) DO NOTHING;

    -- 9. 영업1그룹 (사업본부 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('영업1그룹', v_business_division_id, '영업1그룹')
    ON CONFLICT (name) DO NOTHING;

    -- 10. 영업2그룹 (사업본부 하위)
    INSERT INTO we_departments (name, parent_department_id, description) 
    VALUES ('영업2그룹', v_business_division_id, '영업2그룹')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- ============================================
-- 사용자 데이터 삽입
-- ============================================
-- 비밀번호 해시는 나중에 로그인 기능 구현 시 추가
-- 초기 패스워드는 username과 동일하게 설정 (must_change_password = true)

-- 1. 최계호 - 사업본부 - 전무 - 본부장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'khchoi',
    'khchoi@wemb.co.kr',
    'khchoi', -- 임시: 나중에 해시화 필요 (초기 패스워드 = username)
    '최계호',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'admin' LIMIT 1),
    '본부장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '사업본부' AND rk.code = 'senior_managing_director'
ON CONFLICT (email) DO NOTHING;

-- 2. 황동환 - 기술그룹 - 상무 - 그룹장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'dhhwang',
    'dhhwang@wemb.co.kr',
    'dhhwang',
    '황동환',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'pm' LIMIT 1),
    '그룹장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '기술그룹' AND rk.code = 'managing_director'
ON CONFLICT (email) DO NOTHING;

-- 3. 정문영 - PMO팀 - 이사 - 팀장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'myjung',
    'myjung@wemb.co.kr',
    'myjung',
    '정문영',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'pm' LIMIT 1),
    '팀장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = 'PMO팀' AND rk.code = 'director'
ON CONFLICT (email) DO NOTHING;

-- 4. 정현우 - 개발팀 - 이사 - 팀장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'hwjeong',
    'hwjeong@wemb.co.kr',
    'hwjeong',
    '정현우',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'pm' LIMIT 1),
    '팀장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '개발팀' AND rk.code = 'director'
ON CONFLICT (email) DO NOTHING;

-- 5. 김성록 - 개발 1파트 - 수석(L) - 파트장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'castlesix',
    'castlesix@wemb.co.kr',
    'castlesix',
    '김성록',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'developer' LIMIT 1),
    '파트장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '개발 1파트' AND rk.code = 'principal_l'
ON CONFLICT (email) DO NOTHING;

-- 6. 최진희 - 개발 2파트 - 수석(S) - 파트장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'hser486',
    'hser486@wemb.co.kr',
    'hser486',
    '최진희',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'developer' LIMIT 1),
    '파트장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '개발 2파트' AND rk.code = 'principal_s'
ON CONFLICT (email) DO NOTHING;

-- 7. 김대우 - 개발 3파트 - 수석(S) - 파트장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'dwkim',
    'dwkim@wemb.co.kr',
    'dwkim',
    '김대우',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'developer' LIMIT 1),
    '파트장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '개발 3파트' AND rk.code = 'principal_s'
ON CONFLICT (email) DO NOTHING;

-- 8. 이영준 - 디자인팀 - 수석(S) - 팀장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'yjlee',
    'yjlee@wemb.co.kr',
    'yjlee',
    '이영준',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'developer' LIMIT 1),
    '팀장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '디자인팀' AND rk.code = 'principal_s'
ON CONFLICT (email) DO NOTHING;

-- 9. 윤근호 - 영업1그룹 - 이사 - 그룹장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'ykh',
    'ykh@wemb.co.kr',
    'ykh',
    '윤근호',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'sales' LIMIT 1),
    '그룹장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '영업1그룹' AND rk.code = 'director'
ON CONFLICT (email) DO NOTHING;

-- 10. 황수민 - 영업1그룹 - 사원
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'smhwang',
    'smhwang@wemb.co.kr',
    'smhwang',
    '황수민',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'sales' LIMIT 1),
    NULL,
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '영업1그룹' AND rk.code = 'staff'
ON CONFLICT (email) DO NOTHING;

-- 11. 이기윤 - 영업1그룹 - 수석(L)
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'messiax',
    'messiax@wemb.co.kr',
    'messiax',
    '이기윤',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'sales' LIMIT 1),
    NULL,
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '영업1그룹' AND rk.code = 'principal_l'
ON CONFLICT (email) DO NOTHING;

-- 12. 김채열 - 영업2그룹 - 이사 - 그룹장
INSERT INTO we_users (username, email, password_hash, name, department_id, rank_id, role_id, title, must_change_password, status)
SELECT 
    'cyrla',
    'cyrla@wemb.co.kr',
    'cyrla',
    '김채열',
    d.id,
    rk.id,
    (SELECT id FROM we_roles WHERE name = 'sales' LIMIT 1),
    '그룹장',
    true,
    'active'
FROM we_departments d, we_ranks rk
WHERE d.name = '영업2그룹' AND rk.code = 'director'
ON CONFLICT (email) DO NOTHING;

-- 부서의 manager_id 업데이트
UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '사업본부' AND u.name = '최계호';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '기술그룹' AND u.name = '황동환';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = 'PMO팀' AND u.name = '정문영';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '개발팀' AND u.name = '정현우';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '개발 1파트' AND u.name = '김성록';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '개발 2파트' AND u.name = '최진희';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '개발 3파트' AND u.name = '김대우';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '디자인팀' AND u.name = '이영준';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '영업1그룹' AND u.name = '윤근호';

UPDATE we_departments d
SET manager_id = u.id
FROM we_users u
WHERE d.name = '영업2그룹' AND u.name = '김채열';
