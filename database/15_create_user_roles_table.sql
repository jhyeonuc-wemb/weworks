-- ============================================
-- 사용자-역할 다대다 관계 테이블 생성
-- 사용자가 여러 역할을 가질 수 있도록 지원
-- ============================================

-- we_user_roles (사용자-역할 중간 테이블)
CREATE TABLE IF NOT EXISTS we_user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES we_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES we_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,  -- 주요 역할 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_we_user_roles_user_id ON we_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_we_user_roles_role_id ON we_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_we_user_roles_primary ON we_user_roles(user_id, is_primary) WHERE is_primary = true;

COMMENT ON TABLE we_user_roles IS '사용자-역할 다대다 관계 테이블';
COMMENT ON COLUMN we_user_roles.is_primary IS '주요 역할 여부 (기존 role_id와의 호환성을 위해)';

-- 기존 데이터 마이그레이션: we_users.role_id가 있는 경우 we_user_roles에 추가
INSERT INTO we_user_roles (user_id, role_id, is_primary)
SELECT id, role_id, true
FROM we_users
WHERE role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM we_user_roles ur 
    WHERE ur.user_id = we_users.id AND ur.role_id = we_users.role_id
  )
ON CONFLICT (user_id, role_id) DO NOTHING;
