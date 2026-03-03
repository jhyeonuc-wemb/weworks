const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function deleteHoliday() {
    const client = await pool.connect();
    try {
        console.log('Deleting holiday (2026-09-23) from database...');
        const sql = `DELETE FROM holidays WHERE holiday_date = '2026-09-23' AND name = '추석 연휴'`;
        const result = await client.query(sql);
        console.log(`✅ Deleted ${result.rowCount} record(s).`);
    } catch (err) {
        console.error('❌ Deletion failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

deleteHoliday();
