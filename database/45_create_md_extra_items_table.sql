-- 개발 탭 VRB 전용 추가 항목 테이블 (전역 설정에 등록하지 않고 VRB별로 관리)
CREATE TABLE IF NOT EXISTS we_project_md_extra_items (
    id              SERIAL PRIMARY KEY,
    vrb_id          INTEGER NOT NULL REFERENCES we_project_vrb_reviews(id) ON DELETE CASCADE,
    classification  VARCHAR(200) DEFAULT '',
    content         VARCHAR(500) NOT NULL DEFAULT '',
    standard_md     NUMERIC(10, 2) DEFAULT 0,
    quantity        NUMERIC(10, 2) DEFAULT 0,
    calculated_md   NUMERIC(10, 2) DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_md_extra_items_vrb_id ON we_project_md_extra_items(vrb_id);
