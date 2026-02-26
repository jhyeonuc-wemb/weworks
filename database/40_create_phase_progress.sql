-- ============================================================
-- 40_create_phase_progress.sql
-- 프로젝트 단계별 진행 상태 중앙 관리 테이블 생성
-- ============================================================

BEGIN;

-- ============================================================
-- 1. we_project_phase_progress 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS we_project_phase_progress (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
  phase_code    VARCHAR(50) NOT NULL,   -- project_phases.code 참조
  status        VARCHAR(20) NOT NULL DEFAULT 'STANDBY'
                  CHECK (status IN ('STANDBY', 'IN_PROGRESS', 'COMPLETED')),
  started_at    TIMESTAMP,             -- IN_PROGRESS 진입 시점
  completed_at  TIMESTAMP,             -- COMPLETED 진입 시점
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, phase_code)
);

CREATE INDEX IF NOT EXISTS idx_phase_progress_project_id
  ON we_project_phase_progress(project_id);

CREATE INDEX IF NOT EXISTS idx_phase_progress_phase_code
  ON we_project_phase_progress(phase_code);

-- ============================================================
-- 2. 기존 프로젝트 데이터 seeding
--    current_phase 기준으로 완료된 단계들은 COMPLETED,
--    현재 단계는 각 모듈 테이블 status 참조,
--    이후 단계는 STANDBY
-- ============================================================

-- 모든 활성 프로젝트에 대해 현재까지 지나온 단계를 seeding
INSERT INTO we_project_phase_progress (project_id, phase_code, status, completed_at)
SELECT 
  p.id as project_id,
  pp.code as phase_code,
  -- 단계별 상태 결정 로직
  CASE
    -- MD 산정: 모듈 테이블 status 참조
    WHEN pp.code = 'md_estimation' THEN
      COALESCE(md.status, 'STANDBY')
    -- VRB: 모듈 테이블 status 참조
    WHEN pp.code = 'vrb' THEN
      COALESCE(vrb.status, 
        CASE 
          WHEN p.current_phase IN ('profitability', 'in_progress', 'settlement', 'completed') THEN 'COMPLETED'
          ELSE 'STANDBY'
        END)
    -- 수지분석: 모듈 테이블 status 참조
    WHEN pp.code = 'profitability' THEN
      COALESCE(prof.status,
        CASE
          WHEN p.current_phase IN ('in_progress', 'settlement', 'completed') THEN 'COMPLETED'
          ELSE 'STANDBY'
        END)
    -- 수지정산: 모듈 테이블 status 참조
    WHEN pp.code = 'settlement' THEN
      COALESCE(settle.status,
        CASE
          WHEN p.current_phase = 'completed' THEN 'COMPLETED'
          ELSE 'STANDBY'
        END)
    -- 현재 단계인 경우 (위에서 처리되지 않은 단계)
    WHEN pp.code = p.current_phase THEN 'IN_PROGRESS'
    -- 이미 지나간 단계 (display_order 기준)
    WHEN pp.display_order < (
      SELECT display_order FROM project_phases WHERE code = p.current_phase AND is_active = true LIMIT 1
    ) THEN 'COMPLETED'
    ELSE 'STANDBY'
  END as status,
  -- completed_at: COMPLETED인 경우만 현재 시간으로 설정
  CASE
    WHEN (pp.code = 'md_estimation' AND COALESCE(md.status, 'STANDBY') = 'COMPLETED') OR
         (pp.code = 'vrb' AND COALESCE(vrb.status, 'STANDBY') = 'COMPLETED') OR
         (pp.code = 'profitability' AND COALESCE(prof.status, 'STANDBY') = 'COMPLETED') OR
         (pp.code = 'settlement' AND COALESCE(settle.status, 'STANDBY') = 'COMPLETED') OR
         (pp.display_order < (
           SELECT display_order FROM project_phases WHERE code = p.current_phase AND is_active = true LIMIT 1
         ))
    THEN CURRENT_TIMESTAMP
    ELSE NULL
  END as completed_at
FROM we_projects p
CROSS JOIN project_phases pp
LEFT JOIN (
  SELECT DISTINCT ON (project_id) project_id, status
  FROM we_project_md_estimations ORDER BY project_id, version DESC
) md ON p.id = md.project_id AND pp.code = 'md_estimation'
LEFT JOIN (
  SELECT DISTINCT ON (project_id) project_id, status
  FROM we_project_vrb_reviews ORDER BY project_id, id DESC
) vrb ON p.id = vrb.project_id AND pp.code = 'vrb'
LEFT JOIN (
  SELECT DISTINCT ON (project_id) project_id, status
  FROM we_project_profitability ORDER BY project_id, version DESC
) prof ON p.id = prof.project_id AND pp.code = 'profitability'
LEFT JOIN (
  SELECT DISTINCT ON (project_id) project_id, status
  FROM we_project_settlement ORDER BY project_id, id DESC
) settle ON p.id = settle.project_id AND pp.code = 'settlement'
WHERE pp.is_active = true
ON CONFLICT (project_id, phase_code) DO NOTHING;

-- ============================================================
-- 3. 결과 확인
-- ============================================================

SELECT 
  p.name as project_name, 
  p.current_phase,
  ppp.phase_code,
  ppp.status,
  ph.display_order
FROM we_project_phase_progress ppp
JOIN we_projects p ON p.id = ppp.project_id
JOIN project_phases ph ON ph.code = ppp.phase_code
ORDER BY p.id, ph.display_order;

COMMIT;
