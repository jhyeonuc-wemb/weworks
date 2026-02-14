-- VRB Review 예상 M/M 항목 테이블 생성
CREATE TABLE IF NOT EXISTS we_project_vrb_estimated_mm_items (
    id BIGSERIAL PRIMARY KEY,
    vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
    case_type VARCHAR(10) NOT NULL CHECK (case_type IN ('worst', 'best')),
    item VARCHAR(200) NOT NULL,
    mm DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_pvrb_mm_items_vrb_id ON we_project_vrb_estimated_mm_items(vrb_review_id);
CREATE INDEX IF NOT EXISTS idx_we_pvrb_mm_items_case_type ON we_project_vrb_estimated_mm_items(case_type);
