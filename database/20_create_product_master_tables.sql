-- ============================================
-- 20. 제품/상품 마스터 테이블 (제품계획 탭에서 사용)
-- ============================================

CREATE TABLE IF NOT EXISTS we_products (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,   -- 업체명
    product_name VARCHAR(200) NOT NULL,   -- 제품명
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0, -- 단가 (단위: 천원)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_we_products_unique
    ON we_products(company_name, product_name);

CREATE INDEX IF NOT EXISTS idx_we_products_company_name
    ON we_products(company_name);

CREATE INDEX IF NOT EXISTS idx_we_products_product_name
    ON we_products(product_name);

