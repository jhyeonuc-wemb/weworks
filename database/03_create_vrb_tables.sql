-- ============================================
-- VRB Review 테이블 생성
-- ============================================

-- we_project_vrb_reviews (프로젝트 VRB Review 헤더)
CREATE TABLE IF NOT EXISTS we_project_vrb_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    
    -- 프로젝트 개요
    project_budget VARCHAR(100),
    win_probability VARCHAR(50),
    win_date DATE,
    business_type VARCHAR(50),
    partners VARCHAR(200),
    partner_info TEXT,
    competitors VARCHAR(200),
    customer_info VARCHAR(200),
    sales_manager VARCHAR(100),
    ps_manager VARCHAR(100),
    expected_start_date DATE,
    expected_end_date DATE,
    main_contractor VARCHAR(200),
    key_solutions VARCHAR(200),
    
    -- 사업 정보
    business_background TEXT,
    business_scope TEXT,
    risk TEXT,
    business_basis TEXT,
    
    -- 사전 수지분석서 요약 (Worst Case)
    worst_estimated_revenue_goods DECIMAL(15, 2) DEFAULT 0,
    worst_estimated_revenue_services DECIMAL(15, 2) DEFAULT 0,
    worst_estimated_mm DECIMAL(10, 2) DEFAULT 0,
    worst_other_goods_purchase DECIMAL(15, 2) DEFAULT 0,
    worst_existing_system_linkage DECIMAL(15, 2) DEFAULT 0,
    worst_risk_cost_percent DECIMAL(5, 2) DEFAULT 10,
    worst_operating_profit DECIMAL(15, 2) DEFAULT 0,
    worst_operating_profit_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- 사전 수지분석서 요약 (Best Case)
    best_estimated_revenue_goods DECIMAL(15, 2) DEFAULT 0,
    best_estimated_revenue_services DECIMAL(15, 2) DEFAULT 0,
    best_estimated_mm DECIMAL(10, 2) DEFAULT 0,
    best_other_goods_purchase DECIMAL(15, 2) DEFAULT 0,
    best_existing_system_linkage DECIMAL(15, 2) DEFAULT 0,
    best_risk_cost_percent DECIMAL(5, 2) DEFAULT 10,
    best_operating_profit DECIMAL(15, 2) DEFAULT 0,
    best_operating_profit_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- M/D 산정 연계
    md_estimation_id BIGINT REFERENCES we_project_md_estimations(id),
    
    -- 메타데이터
    created_by BIGINT NOT NULL REFERENCES we_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_we_pvrb_project_id ON we_project_vrb_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_we_pvrb_version ON we_project_vrb_reviews(project_id, version);
CREATE INDEX IF NOT EXISTS idx_we_pvrb_status ON we_project_vrb_reviews(status);
CREATE INDEX IF NOT EXISTS idx_we_pvrb_md_estimation_id ON we_project_vrb_reviews(md_estimation_id);

-- we_project_vrb_key_contents (VRB 주요내용)
CREATE TABLE IF NOT EXISTS we_project_vrb_key_contents (
    id BIGSERIAL PRIMARY KEY,
    vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
    content_date DATE,
    content TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_pvrb_contents_vrb_id ON we_project_vrb_key_contents(vrb_review_id);

-- we_project_vrb_key_activities (VRB 주요활동)
CREATE TABLE IF NOT EXISTS we_project_vrb_key_activities (
    id BIGSERIAL PRIMARY KEY,
    vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
    activity_date DATE,
    activity TEXT NOT NULL,
    attendees VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_pvrb_activities_vrb_id ON we_project_vrb_key_activities(vrb_review_id);

-- we_project_vrb_project_costs (VRB 프로젝트 수행 비용)
CREATE TABLE IF NOT EXISTS we_project_vrb_project_costs (
    id BIGSERIAL PRIMARY KEY,
    vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('worst', 'best')),
    item VARCHAR(200) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_pvrb_costs_vrb_id ON we_project_vrb_project_costs(vrb_review_id);
CREATE INDEX IF NOT EXISTS idx_we_pvrb_costs_case_type ON we_project_vrb_project_costs(case_type);