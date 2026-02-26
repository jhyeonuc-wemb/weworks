-- Migration 42: VRB 난이도 점수 테이블 생성
-- VRB 심의 난이도 탭의 항목별 점수를 저장하는 테이블

CREATE TABLE IF NOT EXISTS we_vrb_difficulty_scores (
  id BIGSERIAL PRIMARY KEY,
  vrb_review_id BIGINT NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL,         -- we_difficulty_items.id (참조용)
  item_name TEXT,                   -- 저장 시점의 항목명 스냅샷
  category_id BIGINT NOT NULL,     -- we_difficulty_categories.id (참조용)
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vrb_review_id, item_id)
);

-- VRB 리뷰 테이블에 난이도 관련 컬럼 추가
ALTER TABLE we_project_vrb_reviews
  ADD COLUMN IF NOT EXISTS difficulty_comment TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_total_score NUMERIC(4,2);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vrb_difficulty_scores_review_id
  ON we_vrb_difficulty_scores(vrb_review_id);
