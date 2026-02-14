-- 사용자 테이블에 grade(등급) 컬럼 추가
-- 등급: 개_특, 개_고, 개_중, 개_초, 컨_특, 컨_고, 컨_중, 컨_초

ALTER TABLE we_users 
ADD COLUMN IF NOT EXISTS grade VARCHAR(10);

COMMENT ON COLUMN we_users.grade IS '등급 (개_특, 개_고, 개_중, 개_초, 컨_특, 컨_고, 컨_중, 컨_초)';
