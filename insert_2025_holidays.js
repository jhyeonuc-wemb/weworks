const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function insert2025Holidays() {
    const client = await pool.connect();
    try {
        console.log('Inserting 2025 South Korea Public Holidays...');

        // 기존 2025년 데이터 삭제 (중복 방지)
        await client.query("DELETE FROM holidays WHERE holiday_date >= '2025-01-01' AND holiday_date <= '2025-12-31'");

        const holidays = [
            ['2025-01-01', '신정', true, '새해 첫날'],
            ['2025-01-28', '설날 연휴', false, '음력 설 연휴'],
            ['2025-01-29', '설날', false, '음력 설 당일'],
            ['2025-01-30', '설날 연휴', false, '음력 설 연휴'],
            ['2025-03-01', '삼일절', true, '3.1 운동 기념일'],
            ['2025-03-03', '삼일절 대체공휴일', false, '토요일(3/1) 대체공휴일'],
            ['2025-05-01', '근로자의 날', true, '유급휴일'],
            ['2025-05-05', '어린이날/부처님오신날', true, '어린이날 및 석가탄신일 중복'],
            ['2025-05-06', '대체공휴일', false, '어린이날/부처님오신날 중복 대체공휴일'],
            ['2025-06-06', '현충일', true, '현충일'],
            ['2025-08-15', '광복절', true, '광복절'],
            ['2025-10-03', '개천절', true, '단기 개국 기념일'],
            ['2025-10-05', '추석 연휴', false, '한가위 연휴(일요일)'],
            ['2025-10-06', '추석', false, '한가위 당일'],
            ['2025-10-07', '추석 연휴', false, '한가위 연휴'],
            ['2025-10-08', '추석 대체공휴일', false, '일요일(10/5) 추석연휴 대체공휴일'],
            ['2025-10-09', '한글날', true, '한글날'],
            ['2025-12-25', '성탄절', true, '기독탄신일']
        ];

        for (const [date, name, recurring, desc] of holidays) {
            await client.query(
                'INSERT INTO holidays (holiday_date, name, is_recurring, description) VALUES ($1, $2, $3, $4)',
                [date, name, recurring, desc]
            );
        }

        console.log(`✅ Successfully inserted ${holidays.length} holidays for 2025.`);
    } catch (err) {
        console.error('❌ Insertion failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

insert2025Holidays();
