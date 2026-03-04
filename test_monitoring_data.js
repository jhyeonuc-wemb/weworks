require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkProjects() {
    try {
        const res = await pool.query(`
      SELECT 
        id, project_code, name, status, current_phase, process_status 
      FROM we_projects 
      LIMIT 10
    `);
        console.log("All projects sample:", res.rows);

        // Check if any match the expected conditions
        const res2 = await pool.query(`
      SELECT count(*) FROM we_projects WHERE current_phase = 'in_progress' AND status = 'active'
    `);
        console.log("Count of in_progress AND active:", res2.rows[0].count);

        const res3 = await pool.query(`
      SELECT count(*) FROM we_projects WHERE current_phase = 'in_progress'
    `);
        console.log("Count of in_progress only:", res3.rows[0].count);

        const res4 = await pool.query(`
      SELECT current_phase, count(*) as count
      FROM we_projects
      GROUP BY current_phase
    `);
        console.log("Counts by custom_phase:");
        res4.rows.forEach(r => console.log(`  ${r.current_phase}: ${r.count}`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkProjects();
