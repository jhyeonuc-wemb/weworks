-- we_project_product_plan 테이블에 누락된 컬럼 추가
-- contract_cost_price: 구매 계약 원가 (천원)
-- profitability_id: 수지분석서 버전 ID (FK)

ALTER TABLE we_project_product_plan
  ADD COLUMN IF NOT EXISTS contract_cost_price DECIMAL(15, 2) NULL,
  ADD COLUMN IF NOT EXISTS profitability_id INTEGER NULL;

-- profitability_id 인덱스
CREATE INDEX IF NOT EXISTS idx_product_plan_profitability_id ON we_project_product_plan(profitability_id);

-- 코멘트
COMMENT ON COLUMN we_project_product_plan.contract_cost_price IS '구매 계약 원가 (천원)';
COMMENT ON COLUMN we_project_product_plan.profitability_id IS '수지분석서 버전 ID';
