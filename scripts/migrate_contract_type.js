const { Pool } = require('pg');
const pool = new Pool({
    host: '115.21.12.186', port: 7432,
    database: 'weworks', user: 'weworks', password: 'weworks!1234',
});
async function run() {
    const client = await pool.connect();
    try {
        await client.query(`ALTER TABLE we_contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT '신규'`);
        console.log('OK: contract_type column added');
    } catch (e) {
        console.error(e.message);
    } finally {
        client.release();
        pool.end();
    }
}
run();
