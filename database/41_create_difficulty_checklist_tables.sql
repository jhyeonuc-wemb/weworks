-- 난이도 체크리스트 카테고리 테이블
-- 카테고리 ID는 고정값 사용 (tech, scope, team, risk, infra)
CREATE TABLE IF NOT EXISTS we_difficulty_categories (
    id VARCHAR(50) PRIMARY KEY,             -- 'tech', 'scope', 'team', 'risk', 'infra'
    label VARCHAR(200) NOT NULL,            -- '기술적 난이도' 등
    overall_weight NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 종합 가중치 (%)
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 난이도 체크리스트 항목 테이블
CREATE TABLE IF NOT EXISTS we_difficulty_items (
    id BIGSERIAL PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES we_difficulty_categories(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL DEFAULT '',  -- 항목명
    weight NUMERIC(5,2) NOT NULL DEFAULT 0, -- 항목 가중치 (%)
    guide_texts TEXT DEFAULT '',            -- 가이드 텍스트 (줄바꿈 구분)
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_difficulty_items_category ON we_difficulty_items(category_id);

-- 기본 카테고리 데이터 삽입
INSERT INTO we_difficulty_categories (id, label, overall_weight, display_order) VALUES
    ('tech',  '기술적 난이도',   30, 0),
    ('scope', '범위 복잡성',     20, 1),
    ('team',  '팀 구성 난이도',  20, 2),
    ('risk',  '리스크 요인',     15, 3),
    ('infra', '인프라 및 환경',  15, 4)
ON CONFLICT (id) DO NOTHING;
