-- 제품 계획 테이블 생성 (PostgreSQL)
-- 프로젝트별 제품(자사)/상품(타사) 계획 데이터 저장

CREATE TABLE IF NOT EXISTS we_project_product_plan (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('자사', '타사')),
  product_id INTEGER NULL,
  company_name VARCHAR(255) DEFAULT '',
  product_name VARCHAR(255) DEFAULT '',
  quantity DECIMAL(10, 2) DEFAULT 0,
  unit_price DECIMAL(15, 2) NULL,
  base_price DECIMAL(15, 2) DEFAULT 0,
  proposal_price DECIMAL(15, 2) NULL,
  discount_rate DECIMAL(5, 2) DEFAULT 0,
  cost_price DECIMAL(15, 2) NULL,
  request_date DATE NULL,
  request_type VARCHAR(20) DEFAULT '' CHECK (request_type IN ('', '예정', '계약(정상)', '계약(변경)', '취소')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES we_projects(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_plan_project_id ON we_project_product_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_product_plan_type ON we_project_product_plan(type);

-- 컬럼 코멘트
COMMENT ON TABLE we_project_product_plan IS '프로젝트 제품 계획';
COMMENT ON COLUMN we_project_product_plan.type IS '제품/상품 구분';
COMMENT ON COLUMN we_project_product_plan.product_id IS '제품 마스터 ID';
COMMENT ON COLUMN we_project_product_plan.company_name IS '업체명';
COMMENT ON COLUMN we_project_product_plan.product_name IS '제품명';
COMMENT ON COLUMN we_project_product_plan.quantity IS '수량';
COMMENT ON COLUMN we_project_product_plan.unit_price IS '단가 (천원)';
COMMENT ON COLUMN we_project_product_plan.base_price IS '기준가 (천원)';
COMMENT ON COLUMN we_project_product_plan.proposal_price IS '제안가 (천원)';
COMMENT ON COLUMN we_project_product_plan.discount_rate IS '할인율 (%)';
COMMENT ON COLUMN we_project_product_plan.cost_price IS '원가 (매입, 천원)';
COMMENT ON COLUMN we_project_product_plan.request_date IS '요청일';
COMMENT ON COLUMN we_project_product_plan.request_type IS '요청구분';
