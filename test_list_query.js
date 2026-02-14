const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function testListQuery() {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                p.project_code,
                p.name as project_name,
                c.name as customer_name
            FROM we_project_settlement s
            LEFT JOIN we_projects p ON s.project_id = p.id
            LEFT JOIN we_clients c ON p.customer_id = c.id
            ORDER BY s.created_at DESC
        `);
        console.log('Result count:', result.rows.length);
        console.log('First row:', JSON.stringify(result.rows[0], null, 2));
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

testListQuery();
