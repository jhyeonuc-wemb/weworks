-- ============================================
-- 26. 수지분석서 수지차(profitability-diff) 부가수익 저장 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS we_project_profitability_extra_revenue (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    extra_revenue DECIMAL(15, 2) DEFAULT 0,          -- 부가 예상 수익 (+)
    extra_revenue_desc TEXT,                         -- 부가 예상 수익 설명
    extra_expense DECIMAL(15, 2) DEFAULT 0,          -- 부가 예상 비용 (-)
    extra_expense_desc TEXT,                         -- 부가 예상 비용 설명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_we_pper_project_id
    ON we_project_profitability_extra_revenue(project_id);
