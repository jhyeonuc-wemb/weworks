const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function insert2026Holidays() {
    const client = await pool.connect();
    try {
        console.log('Inserting 2026 South Korea Public Holidays...');

        // 기존 2026년 데이터 삭제 (중복 방지)
        await client.query("DELETE FROM holidays WHERE holiday_date >= '2026-01-01' AND holiday_date <= '2026-12-31'");

        const holidays = [
            ['2026-01-01', '신정', true, '새해 첫날'],
            ['2026-02-15', '설날 연휴', false, '음력 설 연휴'],
            ['2026-02-16', '설날 연휴', false, '음력 설 연휴'],
            ['2026-02-17', '설날', false, '음력 설 당일'],
            ['2026-02-18', '설날 연휴', false, '음력 설 연휴'],
            ['2026-03-01', '삼일절', true, '3.1 운동 기념일'],
            ['2026-03-02', '삼일절 대체공휴일', false, '일요일(3/1) 대체공휴일'],
            ['2026-05-01', '근로자의 날', true, '유급휴일'],
            ['2026-05-05', '어린이날', true, '어린이날'],
            ['2026-05-24', '부처님 오신 날', false, '석가탄신일'],
            ['2026-05-25', '부처님 오신 날 대체공휴일', false, '일요일(5/24) 대체공휴일'],
            ['2026-06-03', '제9회 지방선거', false, '전국동시지방선거'],
            ['2026-06-06', '현충일', true, '현충일'],
            ['2026-07-17', '제헌절', true, '제헌절 공휴일 재지정'],
            ['2026-08-15', '광복절', true, '광복절'],
            ['2026-08-17', '광복절 대체공휴일', false, '토요일(8/15) 대체공휴일'],
            ['2026-09-24', '추석 연휴', false, '한가위 연휴'],
            ['2026-09-25', '추석', false, '한가위 당일'],
            ['2026-09-26', '추석 연휴', false, '한가위 연휴'],
            ['2026-10-03', '개천절', true, '단기 개국 기념일'],
            ['2026-10-05', '개천절 대체공휴일', false, '토요일(10/3) 대체공휴일'],
            ['2026-10-09', '한글날', true, '한글날'],
            ['2026-12-25', '성탄절', true, '기독탄신일']
        ];

        for (const [date, name, recurring, desc] of holidays) {
            await client.query(
                'INSERT INTO holidays (holiday_date, name, is_recurring, description) VALUES ($1, $2, $3, $4)',
                [date, name, recurring, desc]
            );
        }

        console.log(`✅ Successfully inserted ${holidays.length} holidays for 2026.`);
    } catch (err) {
        console.error('❌ Insertion failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

insert2026Holidays();
