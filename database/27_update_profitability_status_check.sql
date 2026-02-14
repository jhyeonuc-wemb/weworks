-- 수지분석서 상태 체크 제약 조건 업데이트
-- 기존 제약 조건 삭제 후 신규 상태(not_started, in_progress) 포함하여 다시 생성

DO $$
BEGIN
    -- 기존 제약 조건 삭제 (이름을 모르므로 루프를 돌며 삭제하거나 컬럼 타입을 이용)
    -- 보통 we_project_profitability_status_check 같은 식임
    ALTER TABLE we_project_profitability DROP CONSTRAINT IF EXISTS we_project_profitability_status_check;
    
    -- 신규 제약 조건 추가
    ALTER TABLE we_project_profitability 
    ADD CONSTRAINT we_project_profitability_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'draft', 'review', 'approved', 'rejected', 'completed'));
END $$;
