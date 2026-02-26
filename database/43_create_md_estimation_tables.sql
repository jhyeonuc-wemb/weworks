-- ============================================================
-- M/D 산정 설정 테이블 (43_create_md_estimation_tables.sql)
-- ============================================================

-- M/D 산정 카테고리 (개발, 3D모델링, P&ID)
CREATE TABLE IF NOT EXISTS we_md_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,        -- 'development', 'modeling3d', 'pid'
    name VARCHAR(100) NOT NULL,              -- '개발', '3D 모델링', 'P&ID'
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- M/D 산정 항목 (카테고리별 템플릿)
CREATE TABLE IF NOT EXISTS we_md_items (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES we_md_categories(id) ON DELETE CASCADE,
    classification VARCHAR(100),             -- 분류 (예: PM, 개발, I/F, 부지, 건물, ...)
    content VARCHAR(200) NOT NULL,           -- 항목명
    standard_md DECIMAL(10,2) DEFAULT 0,    -- 기준 M/D
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 프로젝트(VRB)별 M/D 수량 입력 데이터
CREATE TABLE IF NOT EXISTS we_project_md_quantities (
    id SERIAL PRIMARY KEY,
    vrb_id INT NOT NULL,
    item_id INT NOT NULL REFERENCES we_md_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) DEFAULT 0,
    calculated_md DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vrb_id, item_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_we_md_items_category ON we_md_items(category_id);
CREATE INDEX IF NOT EXISTS idx_we_project_md_quantities_vrb ON we_project_md_quantities(vrb_id);

-- 초기 카테고리 데이터
INSERT INTO we_md_categories (code, name, sort_order) VALUES
    ('development', '개발', 1),
    ('modeling3d',  '3D 모델링', 2),
    ('pid',         'P&ID', 3)
ON CONFLICT (code) DO NOTHING;

-- 초기 항목 데이터 (개발)
WITH dev_cat AS (SELECT id FROM we_md_categories WHERE code = 'development')
INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order)
SELECT dev_cat.id, t.classification, t.content, t.standard_md, t.sort_order
FROM dev_cat,
(VALUES
    ('PM',    'PM/사업관리',           5,   0),
    ('개발',  '화면 (표준)',            2,   1),
    ('개발',  '화면 (복잡)',            3,   2),
    ('개발',  '화면 (단순)',            1,   3),
    ('개발',  '보고서 (표준)',          3,   4),
    ('개발',  '보고서 (복잡)',          5,   5),
    ('개발',  'ETL/배치',              5,   6),
    ('개발',  'GIS/MAP',              10,   7),
    ('개발',  '3D 애니메이션 (효과, 사운드)', 3, 8),
    ('개발',  'SOP 관리',             20,   9),
    ('개발',  '설정/보고서/통계 등',    3,  10),
    ('개발',  '메타버스',             10,  11),
    ('I/F',   '연계 개발 (단순)',       3,  12),
    ('I/F',   '연계 개발 (표준)',       5,  13),
    ('I/F',   '연계 개발 (복잡)',      10,  14),
    ('2D디자인', '화면 디자인 (시안)',   1,  15),
    ('포탈',  '개발 환경 구축 (서버 설치 포함)', 5, 16),
    ('포탈',  '포탈 (게시판/공지/자료실)', 5, 17),
    ('포탈',  '포탈 (메인/현황판)',     3,  18),
    ('포탈',  '포탈 (관리자)',         5,  19),
    ('포탈',  '포탈 (보고서/통계/설정)', 2, 20)
) AS t(classification, content, standard_md, sort_order)
ON CONFLICT DO NOTHING;

-- 초기 항목 데이터 (3D 모델링)
WITH cat3d AS (SELECT id FROM we_md_categories WHERE code = 'modeling3d')
INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order)
SELECT cat3d.id, t.classification, t.content, t.standard_md, t.sort_order
FROM cat3d,
(VALUES
    ('부지',     '부지 (대형/비정형)',         1,   0),
    ('건물',     '건물 (고층/복잡한 구조)',     5,   1),
    ('건물',     '건물 (중층/일반 구조)',       3,   2),
    ('건물',     '건물 (저층/단순 구조)',       1,   3),
    ('실내',     '실내 (고정밀/복잡)',         10,   4),
    ('실내',     '실내 (표준)',               5,   5),
    ('설비/장비', '설비/장비 (상 - 대형/고정밀)', 2, 6),
    ('설비/장비', '설비/장비 (중 - 중형)',      0.5, 7),
    ('설비/장비', '설비/장비 (하 - 단순 박스)',  0,   8),
    ('설비/장비', '설비/장비 (중복 사용)',      0.1,  9),
    ('캐릭터',   '캐릭터 (메타버스)',          5,  10)
) AS t(classification, content, standard_md, sort_order)
ON CONFLICT DO NOTHING;

-- 초기 항목 데이터 (P&ID)
WITH pid_cat AS (SELECT id FROM we_md_categories WHERE code = 'pid')
INSERT INTO we_md_items (category_id, classification, content, standard_md, sort_order)
SELECT pid_cat.id, t.classification, t.content, t.standard_md, t.sort_order
FROM pid_cat,
(VALUES
    ('P&ID', 'P&ID 도면 (표준)',     1,   0),
    ('P&ID', 'P&ID 도면 (복잡)',    1.5,  1),
    ('배관',  '배관 Iso (표준)',     0.5,  2),
    ('배관',  '배관 Iso (복잡)',     1,    3),
    ('장비',  '장비 상세 모델링',    2,    4)
) AS t(classification, content, standard_md, sort_order)
ON CONFLICT DO NOTHING;
