-- ============================================
-- VRB Review 테이블에 win_date 필드 추가
-- ============================================

-- we_project_vrb_reviews 테이블에 win_date 필드 추가
ALTER TABLE we_project_vrb_reviews 
ADD COLUMN IF NOT EXISTS win_date DATE;

-- 인덱스 추가 (선택사항, win_date로 검색이 필요한 경우)
-- CREATE INDEX IF NOT EXISTS idx_we_pvrb_win_date ON we_project_vrb_reviews(win_date);
