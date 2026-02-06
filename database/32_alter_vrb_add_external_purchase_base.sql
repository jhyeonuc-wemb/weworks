-- VRB Review 테이블에 외부매입 비율 기준 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS worst_external_purchase_base VARCHAR(50) DEFAULT 'operating_profit',
ADD COLUMN IF NOT EXISTS best_external_purchase_base VARCHAR(50) DEFAULT 'operating_profit',
ADD COLUMN IF NOT EXISTS worst_external_purchase2_base VARCHAR(50) DEFAULT 'operating_profit',
ADD COLUMN IF NOT EXISTS best_external_purchase2_base VARCHAR(50) DEFAULT 'operating_profit';
