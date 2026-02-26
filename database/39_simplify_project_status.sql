-- ============================================================
-- 39_simplify_project_status.sql
-- 프로젝트 상태 시스템 단순화 마이그레이션
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: 기존 제약 조건 먼저 제거 (데이터 업데이트를 막지 않도록)
-- ============================================================

ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_status_check;
ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_current_phase_check;

-- ============================================================
-- STEP 2: status → current_phase 데이터 이관
-- ============================================================

UPDATE we_projects SET current_phase = 'vrb'
WHERE status = 'md_estimation_completed';

UPDATE we_projects SET current_phase = 'profitability'
WHERE status IN ('vrb_review', 'vrb_completed', 'vrb_approved');

UPDATE we_projects SET current_phase = 'in_progress'
WHERE status IN ('profitability_analysis', 'profitability_completed',
                 'profitability_review', 'profitability_approved',
                 'team_allocation', 'in_progress');

UPDATE we_projects SET current_phase = 'settlement'
WHERE status IN ('settlement', 'settlement_completed',
                 'settlement_review', 'settlement_approved');

UPDATE we_projects SET current_phase = 'completed'
WHERE status IN ('completed', 'settlement_rejected', 'vrb_rejected', 'profitability_rejected');

UPDATE we_projects SET current_phase = 'warranty'
WHERE status IN ('warranty', 'warranty_completed');

UPDATE we_projects SET current_phase = 'paid_maintenance'
WHERE status = 'paid_maintenance';

-- ============================================================
-- STEP 3: status 값 단순화
-- ============================================================

UPDATE we_projects SET status = 'active'
WHERE status IN (
  'sales_opportunity', 'deal_won',
  'md_estimation', 'md_estimated', 'md_estimation_completed',
  'vrb_review', 'vrb_completed', 'vrb_approved',
  'team_allocation',
  'profitability_analysis', 'profitability_completed',
  'profitability_review', 'profitability_approved',
  'in_progress',
  'settlement', 'settlement_completed',
  'settlement_review', 'settlement_approved',
  'warranty', 'warranty_completed',
  'paid_maintenance'
);

UPDATE we_projects SET status = 'cancelled'
WHERE status IN ('vrb_rejected', 'profitability_rejected', 'settlement_rejected', 'cancelled');

-- ============================================================
-- STEP 4: 새 제약 조건 추가
-- ============================================================

ALTER TABLE we_projects ADD CONSTRAINT we_projects_current_phase_check
CHECK (current_phase IN (
  'sales', 'md_estimation', 'vrb',
  'contract', 'profitability', 'in_progress',
  'settlement', 'warranty', 'paid_maintenance',
  'completed'
));

ALTER TABLE we_projects ADD CONSTRAINT we_projects_status_check
CHECK (status IN (
  'active',
  'on_hold',
  'completed',
  'cancelled'
));

-- 확인
SELECT id, name, status, current_phase FROM we_projects ORDER BY id;

COMMIT;

