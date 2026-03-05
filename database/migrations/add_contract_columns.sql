-- 계약 전용 컬럼 추가 (we_projects)
ALTER TABLE we_projects
  ADD COLUMN IF NOT EXISTS supply_amount BIGINT,
  ADD COLUMN IF NOT EXISTS stamp_duty INTEGER,
  ADD COLUMN IF NOT EXISTS performance_bond_rate NUMERIC(5,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS defect_bond_rate NUMERIC(5,2) DEFAULT 2,
  ADD COLUMN IF NOT EXISTS payment_schedule TEXT,
  ADD COLUMN IF NOT EXISTS contract_notes TEXT,
  ADD COLUMN IF NOT EXISTS contract_date DATE;
