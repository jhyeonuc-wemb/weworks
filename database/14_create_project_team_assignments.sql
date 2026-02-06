-- ============================================
-- 프로젝트 인력 할당 테이블 생성
-- 프로젝트에 할당된 인력 정보를 관리
-- ============================================

-- we_project_team_assignments (프로젝트 인력 할당)
CREATE TABLE IF NOT EXISTS we_project_team_assignments (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES we_users(id) ON DELETE CASCADE,
    
    -- 할당 정보
    role VARCHAR(100),                    -- 역할 (PM, 개발, 설계 등)
    affiliation_group VARCHAR(50),       -- 소속 및 직군 (위엠비_컨설팅, 위엠비_개발, 외주_컨설팅, 외주_개발)
    job_group VARCHAR(50),                 -- 직군 (컨설팅, 개발, 컨_특, 개_특)
    grade VARCHAR(50),                     -- 등급 (특급, 고급, 중급, 초급) - 사용자 기본값 또는 프로젝트별 설정
    
    -- 할당 기간
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- 할당률 (0-100)
    allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES we_users(id),
    updated_by BIGINT REFERENCES we_users(id)
);

CREATE INDEX IF NOT EXISTS idx_we_project_team_assignments_project_id ON we_project_team_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_we_project_team_assignments_user_id ON we_project_team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_we_project_team_assignments_status ON we_project_team_assignments(status);
CREATE INDEX IF NOT EXISTS idx_we_project_team_assignments_dates ON we_project_team_assignments(start_date, end_date);

COMMENT ON TABLE we_project_team_assignments IS '프로젝트 인력 할당 정보';
COMMENT ON COLUMN we_project_team_assignments.affiliation_group IS '소속 및 직군: 위엠비_컨설팅, 위엠비_개발, 외주_컨설팅, 외주_개발';
COMMENT ON COLUMN we_project_team_assignments.job_group IS '직군: 컨설팅, 개발, 컨_특, 개_특';
COMMENT ON COLUMN we_project_team_assignments.grade IS '등급: 특급, 고급, 중급, 초급';
