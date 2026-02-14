-- ============================================
-- 19. 수지분석서 헤더 테이블 (프로젝트별 Profitability)
-- ============================================

CREATE TABLE IF NOT EXISTS we_project_profitability (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'completed')),
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    net_profit DECIMAL(15, 2) DEFAULT 0,
    profit_rate DECIMAL(5, 2) DEFAULT 0,
    created_by BIGINT NOT NULL REFERENCES we_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_we_profitability_project_id
    ON we_project_profitability(project_id);

CREATE INDEX IF NOT EXISTS idx_we_profitability_status
    ON we_project_profitability(status);
