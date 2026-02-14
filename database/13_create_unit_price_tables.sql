-- ============================================
-- 기준단가표 테이블 생성
-- 수지분석서 및 정산서에서 사용할 기준단가 관리
-- ============================================

-- we_unit_prices (기준단가표)
CREATE TABLE IF NOT EXISTS we_unit_prices (
    id BIGSERIAL PRIMARY KEY,
    affiliation_group VARCHAR(50) NOT NULL,  -- 소속 및 직군: 위엠비_컨설팅, 위엠비_개발, 외주_컨설팅, 외주_개발
    job_group VARCHAR(50) NOT NULL,           -- 직군: 컨설팅, 개발, 컨_특, 개_특
    job_level VARCHAR(50) NOT NULL,          -- 직급: 상무, 이사, 수석(L), 책임(M), 사원
    grade VARCHAR(50) NOT NULL,              -- 등급: 특급, 고급, 중급, 초급
    year INTEGER NOT NULL,                   -- 연도: 2026, 2025, 2024
    proposed_standard DECIMAL(12, 2),        -- 제안단가 기준
    proposed_applied DECIMAL(12, 2),          -- 제안단가 적용
    proposed_discount_rate DECIMAL(5, 2),    -- 제안단가 할인률 (%)
    internal_applied DECIMAL(12, 2),          -- 내부단가 적용
    internal_increase_rate DECIMAL(5, 2),   -- 내부단가 인상율 (%)
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES we_users(id),
    updated_by BIGINT REFERENCES we_users(id),
    UNIQUE(affiliation_group, job_group, job_level, grade, year)
);

CREATE INDEX IF NOT EXISTS idx_we_unit_prices_affiliation ON we_unit_prices(affiliation_group);
CREATE INDEX IF NOT EXISTS idx_we_unit_prices_year ON we_unit_prices(year);
CREATE INDEX IF NOT EXISTS idx_we_unit_prices_active ON we_unit_prices(is_active);
CREATE INDEX IF NOT EXISTS idx_we_unit_prices_lookup ON we_unit_prices(affiliation_group, job_group, job_level, grade, year, is_active);

COMMENT ON TABLE we_unit_prices IS '기준단가표 - 수지분석서 및 정산서에서 사용';
COMMENT ON COLUMN we_unit_prices.affiliation_group IS '소속 및 직군: 위엠비_컨설팅, 위엠비_개발, 외주_컨설팅, 외주_개발';
COMMENT ON COLUMN we_unit_prices.job_group IS '직군: 컨설팅, 개발, 컨_특, 개_특';
COMMENT ON COLUMN we_unit_prices.job_level IS '직급: 상무, 이사, 수석(L), 책임(M), 사원';
COMMENT ON COLUMN we_unit_prices.grade IS '등급: 특급, 고급, 중급, 초급';
COMMENT ON COLUMN we_unit_prices.year IS '연도: 2026, 2025, 2024';
COMMENT ON COLUMN we_unit_prices.proposed_standard IS '제안단가 기준';
COMMENT ON COLUMN we_unit_prices.proposed_applied IS '제안단가 적용';
COMMENT ON COLUMN we_unit_prices.proposed_discount_rate IS '제안단가 할인률 (%)';
COMMENT ON COLUMN we_unit_prices.internal_applied IS '내부단가 적용';
COMMENT ON COLUMN we_unit_prices.internal_increase_rate IS '내부단가 인상율 (%)';
