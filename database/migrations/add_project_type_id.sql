-- 프로젝트 유형(project_type_id) 컬럼 추가
-- we_codes 테이블의 CD_002_05_01 하위 코드 참조
ALTER TABLE we_projects
  ADD COLUMN IF NOT EXISTS project_type_id BIGINT REFERENCES we_codes(id);

COMMENT ON COLUMN we_projects.project_type_id IS '프로젝트 유형 (CD_002_05_01 하위 코드)';
