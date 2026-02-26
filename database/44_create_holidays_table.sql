-- 휴일 관리 테이블 생성
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 날짜 검색 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);

-- 기본 공휴일 데이터 삽입 (2026년 기준 예시)
INSERT INTO holidays (holiday_date, name, is_recurring, description)
VALUES 
    ('2026-01-01', '신정', true, '새해 첫날'),
    ('2026-03-01', '삼일절', true, '3.1 운동 기념일'),
    ('2026-05-05', '어린이날', true, '어린이날'),
    ('2026-06-06', '현충일', true, '현충일'),
    ('2026-08-15', '광복절', true, '광복절'),
    ('2026-10-03', '개천절', true, '개천절'),
    ('2026-10-09', '한글날', true, '한글날'),
    ('2026-12-25', '성탄절', true, '기독탄신일')
ON CONFLICT DO NOTHING;
