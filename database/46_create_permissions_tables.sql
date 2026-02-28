-- ============================================
-- 역할별 권한 관리 테이블
-- 역할은 공통코드 CD_001_04 하위 코드로 동적 관리
-- ============================================

-- we_permissions: 메뉴 마스터 (권한 설정 가능한 메뉴 목록)
CREATE TABLE IF NOT EXISTS we_permissions (
    id          BIGSERIAL PRIMARY KEY,
    menu_key    VARCHAR(100) UNIQUE NOT NULL,   -- 예: "projects", "vrb-review"
    menu_label  VARCHAR(200) NOT NULL,           -- 예: "프로젝트 현황"
    menu_group  VARCHAR(100) NOT NULL,           -- 예: "프로젝트", "설정"
    display_order INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_permissions_menu_key ON we_permissions(menu_key);
CREATE INDEX IF NOT EXISTS idx_we_permissions_group ON we_permissions(menu_group);

-- we_role_permissions: 역할별 메뉴 접근/액션 권한
-- role_code: 공통코드 CD_001_04 하위 code 값 (예: "CD_001_04_01")
DROP TABLE IF EXISTS we_role_permissions;
CREATE TABLE IF NOT EXISTS we_role_permissions (
    id          BIGSERIAL PRIMARY KEY,
    role_code   VARCHAR(100) NOT NULL,           -- 공통코드 code 값
    menu_key    VARCHAR(100) NOT NULL,           -- we_permissions.menu_key 참조
    can_access  BOOLEAN NOT NULL DEFAULT false,  -- 메뉴 접근
    can_create  BOOLEAN NOT NULL DEFAULT false,  -- 추가
    can_update  BOOLEAN NOT NULL DEFAULT false,  -- 수정
    can_delete  BOOLEAN NOT NULL DEFAULT false,  -- 삭제
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_code, menu_key)
);

CREATE INDEX IF NOT EXISTS idx_we_rp_role_code ON we_role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_we_rp_menu_key ON we_role_permissions(menu_key);

COMMENT ON TABLE we_permissions IS '권한 설정 가능한 메뉴 마스터';
COMMENT ON TABLE we_role_permissions IS '역할(공통코드 CD_001_04)별 메뉴 권한 설정';
COMMENT ON COLUMN we_role_permissions.role_code IS '공통코드 CD_001_04 하위 code 값';

-- 메뉴 마스터 초기 데이터
INSERT INTO we_permissions (menu_key, menu_label, menu_group, display_order) VALUES
  ('dashboard',                   '대시보드',              '일반',     10),
  ('sales',                       '영업/PS',               '프로젝트', 20),
  ('projects',                    '프로젝트 현황',          '프로젝트', 30),
  ('vrb-review',                  'VRB 현황',              '프로젝트', 40),
  ('contract-status',             '계약 현황',              '프로젝트', 50),
  ('profitability',               '수지분석 현황',          '프로젝트', 60),
  ('settlement',                  '수지정산 현황',          '프로젝트', 70),
  ('maintenance/free',            '무상 유지보수',          '유지보수', 80),
  ('maintenance/paid',            '유상 유지보수',          '유지보수', 90),
  ('resources/work-logs',         '개인 작업일지',          '자원',     100),
  ('settings/clients',            '프로젝트 기준정보',      '설정',     110),
  ('settings/codes',              '공통 코드',              '설정',     120),
  ('settings/departments',        '부서',                   '설정',     130),
  ('settings/users',              '사용자',                 '설정',     140),
  ('settings/permissions',        '권한',                   '설정',     150),
  ('settings/difficulty-checklist','난이도 체크리스트',     '설정',     160),
  ('settings/md-estimation',      'M/D 산정 항목',          '설정',     170),
  ('settings/holidays',           '휴일',                   '설정',     180)
ON CONFLICT (menu_key) DO NOTHING;
