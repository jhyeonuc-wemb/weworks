-- 사용자 테이블에 필요한 필드 추가
ALTER TABLE we_users 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rank_id BIGINT,
ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- username 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_we_users_username ON we_users(username);

-- 직급 테이블 생성
CREATE TABLE IF NOT EXISTS we_ranks (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_we_ranks_code ON we_ranks(code);
CREATE INDEX IF NOT EXISTS idx_we_ranks_display_order ON we_ranks(display_order);

-- we_users 테이블의 rank_id 외래키 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'we_users_rank_id_fkey'
    ) THEN
        ALTER TABLE we_users 
        ADD CONSTRAINT we_users_rank_id_fkey 
        FOREIGN KEY (rank_id) REFERENCES we_ranks(id);
    END IF;
END $$;
