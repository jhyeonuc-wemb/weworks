-- VRB Review 테이블에 외부매입2 반영 영업이익 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS worst_operating_profit2 DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS worst_operating_profit2_percent DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS best_operating_profit2 DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS best_operating_profit2_percent DECIMAL(5, 2);
