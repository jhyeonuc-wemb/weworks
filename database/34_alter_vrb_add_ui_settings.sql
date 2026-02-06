-- we_project_vrb_reviews 테이블에 UI 설정 저장을 위한 JSONB 컬럼 추가
ALTER TABLE we_project_vrb_reviews ADD COLUMN IF NOT EXISTS ui_settings JSONB DEFAULT '{}'::jsonb;

-- we_project_vrb_key_contents 테이블에 개별 항목 높이 저장을 위한 컬럼 추가
ALTER TABLE we_project_vrb_key_contents ADD COLUMN IF NOT EXISTS ui_height INTEGER;

-- we_project_vrb_key_activities 테이블에 개별 항목 높이 저장을 위한 컬럼 추가
ALTER TABLE we_project_vrb_key_activities ADD COLUMN IF NOT EXISTS ui_height INTEGER;
