-- 수지정산서 테이블 생성
-- Migration 36: Create Settlement Tables

-- 1. 정산서 헤더 테이블
CREATE TABLE we_project_settlement (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    profitability_id BIGINT REFERENCES we_project_profitability(id),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    
    -- 정산 기간
    settlement_date DATE NOT NULL,
    
    -- 계획 데이터 (수지분석서에서 복사)
    planned_revenue DECIMAL(15, 2) DEFAULT 0,
    planned_cost DECIMAL(15, 2) DEFAULT 0,
    planned_labor_cost DECIMAL(15, 2) DEFAULT 0,
    planned_other_cost DECIMAL(15, 2) DEFAULT 0,
    planned_profit DECIMAL(15, 2) DEFAULT 0,
    planned_profit_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- 실적 데이터
    actual_revenue DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    actual_labor_cost DECIMAL(15, 2) DEFAULT 0,
    actual_other_cost DECIMAL(15, 2) DEFAULT 0,
    
    -- 차이 (자동 계산)
    revenue_diff DECIMAL(15, 2) GENERATED ALWAYS AS (actual_revenue - planned_revenue) STORED,
    cost_diff DECIMAL(15, 2) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
    profit_diff DECIMAL(15, 2) GENERATED ALWAYS AS ((actual_revenue - actual_cost) - planned_profit) STORED,
    
    notes TEXT,
    created_by BIGINT REFERENCES we_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_settlement_project_id ON we_project_settlement(project_id);
CREATE INDEX idx_project_settlement_profitability_id ON we_project_settlement(profitability_id);
CREATE INDEX idx_project_settlement_status ON we_project_settlement(status);

-- 2. 정산 인력 상세 테이블
CREATE TABLE we_project_settlement_labor (
    id BIGSERIAL PRIMARY KEY,
    settlement_id BIGINT NOT NULL REFERENCES we_project_settlement(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES we_users(id),
    user_name VARCHAR(100),
    role VARCHAR(100),
    
    -- 계획
    planned_mm DECIMAL(10, 2) DEFAULT 0,
    planned_cost DECIMAL(15, 2) DEFAULT 0,
    
    -- 실적
    actual_mm DECIMAL(10, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    
    -- 차이
    mm_diff DECIMAL(10, 2) GENERATED ALWAYS AS (actual_mm - planned_mm) STORED,
    cost_diff DECIMAL(15, 2) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
    
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlement_labor_settlement_id ON we_project_settlement_labor(settlement_id);
CREATE INDEX idx_settlement_labor_user_id ON we_project_settlement_labor(user_id);

-- 3. 정산 항목 상세 테이블
CREATE TABLE we_project_settlement_items (
    id BIGSERIAL PRIMARY KEY,
    settlement_id BIGINT NOT NULL REFERENCES we_project_settlement(id) ON DELETE CASCADE,
    item_category VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(100),
    
    -- 계획
    planned_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- 실적
    actual_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- 차이
    diff_amount DECIMAL(15, 2) GENERATED ALWAYS AS (actual_amount - planned_amount) STORED,
    diff_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN planned_amount > 0 THEN ((actual_amount - planned_amount) / planned_amount) * 100
            ELSE 0
        END
    ) STORED,
    
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlement_items_settlement_id ON we_project_settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_category ON we_project_settlement_items(item_category);
