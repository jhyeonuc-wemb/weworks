-- VRB Review 테이블에 반려 사유 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
