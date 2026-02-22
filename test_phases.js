
const { Client } = require('pg');

// PostgreSQL 연결 설정 (환경 변수 또는 기본값 사용)
const client = new Client({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'weworks',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function checkPhases() {
    try {
        await client.connect();
        console.log('Connected to database');

        const res = await client.query('SELECT * FROM project_phases ORDER BY display_order');
        console.log('Project Phases Data:');
        console.table(res.rows);

        await client.end();
    } catch (err) {
        console.error('Error executing query', err);
        await client.end();
    }
}

checkPhases();
