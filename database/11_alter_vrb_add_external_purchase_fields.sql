-- VRB Review 테이블에 외부매입 관련 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS worst_external_purchase_percent DECIMAL(5, 2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS best_external_purchase_percent DECIMAL(5, 2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS worst_include_external_purchase BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS best_include_external_purchase BOOLEAN DEFAULT false;
