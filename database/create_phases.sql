-- project_phases 테이블 생성
CREATE TABLE IF NOT EXISTS project_phases (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phase_group VARCHAR(50) NOT NULL CHECK (phase_group IN ('sales_ps', 'project', 'maintenance')),
    path VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_phases_code ON project_phases(code);
CREATE INDEX IF NOT EXISTS idx_project_phases_group ON project_phases(phase_group);
CREATE INDEX IF NOT EXISTS idx_project_phases_order ON project_phases(display_order);

-- 초기 데이터 삽입
INSERT INTO project_phases (code, name, phase_group, path, display_order, description) VALUES
('lead', '리드', 'sales_ps', '', 1, '잠재 사업 발굴'),
('opportunity', '영업기회', 'sales_ps', '', 2, '사업 기회 구체화'),
('md_estimation', 'M/D 산정', 'sales_ps', '/md-estimation', 3, 'VRB 준비 및 견적'),
('vrb', 'VRB 심의', 'sales_ps', '/vrb-review', 4, '수주 심의'),
('contract', '계약', 'project', '', 5, '수주 성공 및 계약 체결'),
('profitability', '수지분석', 'project', '/profitability', 6, '실행 예산 수립'),
('in_progress', '프로젝트 진행', 'project', '', 7, '프로젝트 수행'),
('settlement', '수지정산', 'project', '/settlement', 8, '종료 및 정산'),
('warranty', '하자보증', 'project', '/warranty', 9, '무상 유지보수'),
('paid_maintenance', '유상유지보수', 'project', '/maintenance', 10, '유상 유지보수')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    phase_group = EXCLUDED.phase_group,
    path = EXCLUDED.path,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description;
