const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function checkSettlements() {
    try {
        const result = await pool.query('SELECT * FROM we_project_settlement ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Settlements:', JSON.stringify(result.rows, null, 2));
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSettlements();
