-- VRB Review 테이블에 customer_name 컬럼 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
