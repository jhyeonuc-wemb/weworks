-- Manpower Plan Schema Update
-- Checks if table exists, if not creates it.
-- If exists, adds missing columns.

CREATE TABLE IF NOT EXISTS we_project_manpower_plan (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255),
    role VARCHAR(100),
    detailed_task VARCHAR(255),
    company_name VARCHAR(100),
    affiliation_group VARCHAR(100),
    wmb_rank VARCHAR(50),
    grade VARCHAR(50),
    name VARCHAR(100),
    user_id BIGINT,
    monthly_allocation JSONB DEFAULT '{}',
    proposed_unit_price DECIMAL(15, 0), -- 단가 (천원 단위 정수 or 소수? usually integer or 1 decimal point for unit price in thousands, but user asked for 2? No, user asked month inputs to be 2 decimals. Unit price usually integer in KRW thousands.)
    proposed_amount DECIMAL(15, 0), -- 금액
    internal_unit_price DECIMAL(15, 0), -- 내부단가
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist (Idempotent approach for PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'affiliation_group') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN affiliation_group VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'wmb_rank') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN wmb_rank VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'grade') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN grade VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'name') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'user_id') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN user_id BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'proposed_unit_price') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN proposed_unit_price DECIMAL(15, 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'proposed_amount') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN proposed_amount DECIMAL(15, 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_manpower_plan' AND column_name = 'internal_unit_price') THEN
        ALTER TABLE we_project_manpower_plan ADD COLUMN internal_unit_price DECIMAL(15, 0);
    END IF;
END $$;
