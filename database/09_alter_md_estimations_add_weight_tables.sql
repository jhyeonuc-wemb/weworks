-- ============================================
-- M/D 산정 테이블에 가중치 테이블 JSON 컬럼 추가
-- ============================================

-- 3D 모델링 가중치 테이블 JSON 컬럼 추가
ALTER TABLE we_project_md_estimations 
ADD COLUMN IF NOT EXISTS modeling_3d_weights JSONB;

-- P&ID 가중치 테이블 JSON 컬럼 추가
ALTER TABLE we_project_md_estimations 
ADD COLUMN IF NOT EXISTS pid_weights JSONB;
