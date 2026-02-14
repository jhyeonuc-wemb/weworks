-- ============================================
-- 18. 수지분석서 기준-경비(standard-expense) 프로젝트별 저장 테이블
-- ============================================

-- we_project_profitability_standard_expenses
-- 각 프로젝트의 수지분석서 기준-경비 탭에서 수정한 값 저장용
-- row_id 는 화면상의 행 ID(1~9)를 그대로 사용
CREATE TABLE IF NOT EXISTS we_project_profitability_standard_expenses (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    row_id INTEGER NOT NULL,                         -- 1~9
    calculated_value DECIMAL(12, 2),                 -- 기준 3열 (수정 가능한 행만 사용)
    final_amount DECIMAL(12, 2),                     -- 기준액 열 (수정 가능한 행만 사용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, row_id)
);

CREATE INDEX IF NOT EXISTS idx_we_ppse_project_id
    ON we_project_profitability_standard_expenses(project_id);

