-- VRB Review 테이블에 HW 예상 수주 금액 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS worst_estimated_revenue_hw DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_estimated_revenue_hw DECIMAL(15, 2) DEFAULT 0;
