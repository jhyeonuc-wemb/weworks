const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234'
});

async function run() {
    try {
        const res = await pool.query("SELECT id, project_code, name, status, current_phase FROM we_projects WHERE project_code = 'P25-019'");
        console.log("Before:", res.rows[0]);

        if (res.rows[0].current_phase === 'in_progress' && res.rows[0].status !== 'in_progress') {
            console.log("Updating status to in_progress...");
            await pool.query("UPDATE we_projects SET status = 'in_progress' WHERE id = $1", [res.rows[0].id]);

            const resAfter = await pool.query("SELECT id, project_code, name, status, current_phase FROM we_projects WHERE project_code = 'P25-019'");
            console.log("After:", resAfter.rows[0]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
