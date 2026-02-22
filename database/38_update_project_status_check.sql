-- we_projects 테이블의 status 체크 제약 조건 업데이트
-- md_estimation_completed, vrb_completed 등 가이드라인에 정의된 상태값 추가

DO $$
BEGIN
    -- 기존 제약 조건 삭제
    ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_status_check;
    
    -- 신규 제약 조건 추가
    ALTER TABLE we_projects 
    ADD CONSTRAINT we_projects_status_check 
    CHECK (status IN (
        'sales_opportunity', 'deal_won',
        'md_estimation', 'md_estimated', 'md_estimation_completed',
        'vrb_review', 'vrb_completed', 'vrb_approved', 'vrb_rejected',
        'team_allocation',
        'profitability_analysis', 'profitability_completed',
        'profitability_review', 'profitability_approved', 'profitability_rejected',
        'in_progress', 'on_hold', 'completed',
        'settlement', 'settlement_completed',
        'settlement_review', 'settlement_approved', 'settlement_rejected',
        'warranty', 'warranty_completed',
        'paid_maintenance',
        'cancelled'
    ));
END $$;
