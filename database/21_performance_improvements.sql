-- 21. 성능 및 데이터 품질 개선

-- ============================================
-- 1. 복합 인덱스 추가 (조회 성능 향상)
-- ============================================

-- 프로젝트 상태/단계 조합 조회 최적화
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_projects') THEN
        CREATE INDEX IF NOT EXISTS idx_we_projects_status_phase 
        ON we_projects(status, current_phase) 
        WHERE status IS NOT NULL;
    END IF;
END $$;

-- 기준단가 조회 최적화 (연도 + 소속 + 활성여부)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_unit_prices') THEN
        CREATE INDEX IF NOT EXISTS idx_we_unit_prices_year_affiliation_active
        ON we_unit_prices(year, affiliation_group, is_active)
        WHERE is_active = true;
    END IF;
END $$;

-- 수지분석서 조회 최적화 (프로젝트 + 상태)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_profitability') THEN
        CREATE INDEX IF NOT EXISTS idx_we_profitability_project_status
        ON we_project_profitability(project_id, status);
    END IF;
END $$;

-- VRB 조회 최적화 (프로젝트 + 상태)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_vrb_reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_we_vrb_project_status
        ON we_project_vrb_reviews(project_id, status);
    END IF;
END $$;

-- 사용자 역할 조회 최적화 (테이블이 있는 경우만)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_user_roles') THEN
        CREATE INDEX IF NOT EXISTS idx_we_user_roles_user_id ON we_user_roles(user_id);
    END IF;
END $$;

-- ============================================
-- 2. 뷰 생성 (복잡한 조인 간소화)
-- ============================================

-- 프로젝트 상세 정보 뷰 (고객사, 담당자 정보 포함)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_projects') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW v_we_projects_detail AS
        SELECT 
            p.id,
            p.project_code,
            p.name,
            p.status,
            p.current_phase,
            p.contract_start_date,
            p.contract_end_date,
            p.currency,
            p.expected_amount,
            c.id as customer_id,
            c.name as customer_name,
            c.code as customer_code,
            o.id as orderer_id,
            o.name as orderer_name,
            m.id as manager_id,
            m.name as manager_name,
            m.email as manager_email,
            s.id as sales_rep_id,
            s.name as sales_rep_name,
            cat.id as category_id,
            cat.name as category_name,
            cat.code as category_code,
            p.created_at,
            p.updated_at
        FROM we_projects p
        LEFT JOIN we_clients c ON p.customer_id = c.id
        LEFT JOIN we_clients o ON p.orderer_id = o.id
        LEFT JOIN we_users m ON p.manager_id = m.id
        LEFT JOIN we_users s ON p.sales_representative_id = s.id
        LEFT JOIN we_project_categories cat ON p.category_id = cat.id';
    END IF;
END $$;

-- 기준단가 상세 뷰 (전년도 단가 포함)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_unit_prices') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW v_we_unit_prices_detail AS
        SELECT 
            up.id,
            up.affiliation_group,
            up.job_group,
            up.job_level,
            up.grade,
            up.year,
            up.proposed_standard,
            up.proposed_applied,
            up.proposed_discount_rate,
            up.internal_applied,
            up.internal_increase_rate,
            up.is_active,
            up.display_order,
            LAG(up.internal_applied) OVER (
                PARTITION BY up.affiliation_group, up.job_group, up.job_level, up.grade 
                ORDER BY up.year
            ) as prev_year_internal_applied,
            up.created_at,
            up.updated_at
        FROM we_unit_prices up
        ORDER BY up.year DESC, up.affiliation_group, up.display_order';
    END IF;
END $$;

-- 수지분석서 목록 뷰 (프로젝트 정보 포함)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_profitability') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW v_we_profitability_list AS
        SELECT 
            pf.id,
            pf.project_id,
            pf.version,
            pf.status,
            pf.total_revenue,
            pf.total_cost,
            pf.net_profit,
            pf.profit_rate,
            p.name as project_name,
            p.project_code,
            c.name as customer_name,
            u.name as created_by_name,
            pf.created_at,
            pf.updated_at
        FROM we_project_profitability pf
        INNER JOIN we_projects p ON pf.project_id = p.id
        LEFT JOIN we_clients c ON p.customer_id = c.id
        LEFT JOIN we_users u ON pf.created_by = u.id
        ORDER BY pf.created_at DESC';
    END IF;
END $$;

-- ============================================
-- 3. 제약 조건 개선
-- ============================================

-- 금액 필드는 음수 불가
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_profitability') THEN
        ALTER TABLE we_project_profitability
        DROP CONSTRAINT IF EXISTS chk_profitability_amounts_positive;
        
        ALTER TABLE we_project_profitability
        ADD CONSTRAINT chk_profitability_amounts_positive
        CHECK (
            total_revenue >= 0 AND 
            total_cost >= 0
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_unit_prices') THEN
        ALTER TABLE we_unit_prices
        DROP CONSTRAINT IF EXISTS chk_unit_prices_positive;
        
        ALTER TABLE we_unit_prices
        ADD CONSTRAINT chk_unit_prices_positive
        CHECK (
            (proposed_standard IS NULL OR proposed_standard >= 0) AND
            (proposed_applied IS NULL OR proposed_applied >= 0) AND
            (internal_applied IS NULL OR internal_applied >= 0)
        );
        
        ALTER TABLE we_unit_prices
        DROP CONSTRAINT IF EXISTS chk_unit_prices_year_range;
        
        ALTER TABLE we_unit_prices
        ADD CONSTRAINT chk_unit_prices_year_range
        CHECK (year >= 2020 AND year <= 2100);
    END IF;
END $$;

-- ============================================
-- 4. 통계 정보 갱신 (쿼리 최적화)
-- ============================================

-- 통계 갱신 (테이블이 있는 경우만)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_projects') THEN
        EXECUTE 'ANALYZE we_projects';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_unit_prices') THEN
        EXECUTE 'ANALYZE we_unit_prices';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_profitability') THEN
        EXECUTE 'ANALYZE we_project_profitability';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_vrb_reviews') THEN
        EXECUTE 'ANALYZE we_project_vrb_reviews';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_products') THEN
        EXECUTE 'ANALYZE we_products';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_users') THEN
        EXECUTE 'ANALYZE we_users';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_clients') THEN
        EXECUTE 'ANALYZE we_clients';
    END IF;
END $$;

-- ============================================
-- 5. 자동 업데이트 트리거 (updated_at)
-- ============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 주요 테이블에 트리거 적용
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_projects') THEN
        DROP TRIGGER IF EXISTS update_we_projects_updated_at ON we_projects;
        CREATE TRIGGER update_we_projects_updated_at 
            BEFORE UPDATE ON we_projects 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_unit_prices') THEN
        DROP TRIGGER IF EXISTS update_we_unit_prices_updated_at ON we_unit_prices;
        CREATE TRIGGER update_we_unit_prices_updated_at 
            BEFORE UPDATE ON we_unit_prices 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_products') THEN
        DROP TRIGGER IF EXISTS update_we_products_updated_at ON we_products;
        CREATE TRIGGER update_we_products_updated_at 
            BEFORE UPDATE ON we_products 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'we_project_profitability') THEN
        DROP TRIGGER IF EXISTS update_we_profitability_updated_at ON we_project_profitability;
        CREATE TRIGGER update_we_profitability_updated_at 
            BEFORE UPDATE ON we_project_profitability 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 6. 유용한 헬퍼 함수
-- ============================================

-- 프로젝트 단계 진행 함수
CREATE OR REPLACE FUNCTION advance_project_phase(
    p_project_id BIGINT,
    p_new_status VARCHAR(50),
    p_new_phase VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE we_projects
    SET 
        status = p_new_status,
        current_phase = p_new_phase,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_project_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 수지분석서 요약 계산 함수
CREATE OR REPLACE FUNCTION calculate_profitability_summary(
    p_project_id BIGINT
)
RETURNS TABLE (
    total_revenue DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    profit_rate DECIMAL(5,2)
) AS $$
BEGIN
    -- 실제 계산 로직은 애플리케이션에서 처리
    -- 여기는 기본 구조만 제공
    RETURN QUERY
    SELECT 
        COALESCE(pf.total_revenue, 0::DECIMAL(15,2)),
        COALESCE(pf.total_cost, 0::DECIMAL(15,2)),
        COALESCE(pf.net_profit, 0::DECIMAL(15,2)),
        COALESCE(pf.profit_rate, 0::DECIMAL(5,2))
    FROM we_project_profitability pf
    WHERE pf.project_id = p_project_id
    ORDER BY pf.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 코멘트 추가 (문서화)
-- ============================================

COMMENT ON TABLE we_projects IS '프로젝트 기본 정보';
COMMENT ON TABLE we_unit_prices IS '연도별 기준단가표';
COMMENT ON TABLE we_project_profitability IS '프로젝트별 수지분석서 헤더';
COMMENT ON TABLE we_project_profitability_standard_expenses IS '프로젝트별 기준경비 상세';
COMMENT ON TABLE we_products IS '제품/상품 마스터';
COMMENT ON TABLE we_user_roles IS '사용자별 다중 역할 매핑';

COMMENT ON COLUMN we_projects.status IS '프로젝트 전체 상태 (워크플로우)';
COMMENT ON COLUMN we_projects.current_phase IS '현재 진행 단계';
COMMENT ON COLUMN we_unit_prices.internal_increase_rate IS '전년도 대비 내부단가 증감율 (%)';
COMMENT ON COLUMN we_project_profitability.profit_rate IS '영업이익률 (%)';
