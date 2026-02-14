-- 수주품의 테이블
CREATE TABLE IF NOT EXISTS we_project_order_proposal (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    contract_type VARCHAR(100),         -- 계약형태
    contract_category VARCHAR(100),     -- 계약유형
    main_contract VARCHAR(200),         -- 주계약
    main_operator VARCHAR(200),         -- 주사업자
    execution_location TEXT,            -- 수행장소
    overview TEXT,                       -- 개요
    special_notes TEXT,                  -- 특이사항
    risk TEXT,                           -- Risk
    payment_terms JSONB,                 -- 대금조건 (JSON: { labor: [...], product: [...] })
    partners JSONB,                      -- 협력업체 (JSON: [...])
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_we_pop_project_id ON we_project_order_proposal(project_id);
