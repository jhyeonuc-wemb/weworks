const { Pool } = require('pg');
const pool = new Pool({ host: '115.21.12.186', port: 7432, database: 'weworks', user: 'weworks', password: 'weworks!1234', connectionTimeoutMillis: 20000 });
async function migrate() {
    const client = await pool.connect();
    try {
        await client.query(`ALTER TABLE we_projects ADD COLUMN IF NOT EXISTS research_code VARCHAR(50)`);
        console.log('✅ research_code column added');
        const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='we_projects' AND column_name='research_code'`);
        console.log(' -', r.rows[0]?.column_name);
    } finally { client.release(); await pool.end(); }
}
migrate().catch(e => { console.error(e.message); process.exit(1); });
