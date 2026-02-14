
-- 1. category_id의 외래키 제약조건 삭제 (기존 we_project_categories 참조)
ALTER TABLE we_projects DROP CONSTRAINT IF EXISTS we_projects_category_id_fkey;

-- 2. category_id가 we_codes를 참조하도록 변경
-- (주의: 기존 데이터가 we_codes에 없으면 오류 발생 가능성 있음. 
-- 개발 단계이므로 기존 데이터가 무시되거나 호환되지 않을 수 있음을 가정하고 진행)
-- 안전을 위해 기존 category_id 값을 NULL로 초기화 할 수도 있음: UPDATE we_projects SET category_id = NULL;
-- 하지만 여기서는 제약조건만 추가함. 실패시 수동 조치 필요.
-- ALTER TABLE we_projects ADD CONSTRAINT we_projects_category_id_fkey FOREIGN KEY (category_id) REFERENCES we_codes(id);

-- 3. field_id 컬럼 추가 (we_codes 참조)
ALTER TABLE we_projects ADD COLUMN IF NOT EXISTS field_id BIGINT REFERENCES we_codes(id);

-- 4. 기존 category_id가 we_codes와 호환되지 않을 경우를 대비해 FK는 추가하지 않고 인덱스만 유지하거나,
-- 데이터 마이그레이션이 필요함.
-- 여기서는 category_id 컬럼의 FK를 제거하고, 향후 we_codes ID를 저장하도록 함.
-- 명시적 FK는 데이터 정합성을 위해 권장되지만, 마이그레이션 복잡성을 피하기 위해 일단 생략하거나 
-- we_codes에 맞는 데이터로 업데이트 후 추가해야 함.
-- 일단 FK 없이 진행하거나, 새로운 컬럼을 만들고 기존 컬럼을 deprecate하는 것이 안전함.

-- 하지만 요구사항은 "바인딩"이므로, UI에서 we_codes ID를 보내면 DB에 잘 저장되어야 함.
-- bigint 타입이면 저장 가능.

-- 5. 기존 field 컬럼이 없으므로 추가. (위에서 추가함)
