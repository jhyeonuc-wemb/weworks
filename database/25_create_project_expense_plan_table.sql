-- Project Expense Plan Table
-- Stores monthly expenses for general and special categories

CREATE TABLE IF NOT EXISTS we_project_expense_plan (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- '일반경비', '특별경비', '투여공수' 등
    item VARCHAR(100) NOT NULL, -- '야근식대_당사', '워크샵' 등
    monthly_values JSONB DEFAULT '{}', -- { "2026-01": 1000, "2026-02": 2000 ... }
    is_auto_calculated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, category, item)
);

CREATE INDEX IF NOT EXISTS idx_we_expense_plan_project_id ON we_project_expense_plan(project_id);
