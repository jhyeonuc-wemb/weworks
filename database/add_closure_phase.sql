-- 1) phase_group CHECK 제약 조건에 'closure' 추가
ALTER TABLE project_phases DROP CONSTRAINT IF EXISTS project_phases_phase_group_check;
ALTER TABLE project_phases ADD CONSTRAINT project_phases_phase_group_check
    CHECK (phase_group IN ('sales_ps', 'project', 'maintenance', 'closure'));

-- 2) 종료 단계 추가
INSERT INTO project_phases (code, name, phase_group, path, display_order, description) VALUES
('closure', '종료', 'closure', '', 11, '프로젝트 종료')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    phase_group = EXCLUDED.phase_group,
    path = EXCLUDED.path,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description;
