-- VRB Review 테이블에 리스크 비용 계산 기준 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS worst_risk_cost_base VARCHAR(50) DEFAULT 'total_revenue',
ADD COLUMN IF NOT EXISTS best_risk_cost_base VARCHAR(50) DEFAULT 'total_revenue';
