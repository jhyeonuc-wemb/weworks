const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function updateProjects() {
    try {
        const res = await pool.query('UPDATE we_projects SET created_by = manager_id WHERE created_by = 1 AND manager_id IS NOT NULL');
        console.log("Updated projects count:", res.rowCount);
        await pool.end();
    } catch (error) {
        console.error("Update failed:", error);
        await pool.end();
    }
}

updateProjects();
