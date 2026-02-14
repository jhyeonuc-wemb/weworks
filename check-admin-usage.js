const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || '115.21.12.186',
    port: parseInt(process.env.DB_PORT || '7432'),
    database: process.env.DB_NAME || 'weworks',
    user: process.env.DB_USER || 'weworks',
    password: process.env.DB_PASSWORD || 'weworks!1234',
});

async function checkAdminUsage() {
    try {
        // 1. Find admin user
        const userRes = await pool.query("SELECT id, username, name FROM we_users WHERE username = 'admin' OR name = '관리자' OR email = 'admin@weworks.co.kr'");
        if (userRes.rows.length === 0) {
            console.log("Admin user not found.");
            await pool.end();
            return;
        }

        const admin = userRes.rows[0];
        const adminId = admin.id;
        console.log(`Found Admin User: ${admin.name} (ID: ${adminId}, Username: ${admin.username})`);
        console.log("--------------------------------------------------");

        // 2. Check we_projects
        const projectsCreated = await pool.query("SELECT id, project_code, name FROM we_projects WHERE created_by = $1", [adminId]);
        console.log(`Projects created by admin: ${projectsCreated.rowCount}`);
        projectsCreated.rows.forEach(p => console.log(`  - [${p.project_code}] ${p.name}`));

        const projectsManaged = await pool.query("SELECT id, project_code, name FROM we_projects WHERE manager_id = $1", [adminId]);
        console.log(`Projects managed by admin (PM): ${projectsManaged.rowCount}`);
        projectsManaged.rows.forEach(p => console.log(`  - [${p.project_code}] ${p.name}`));

        const projectsSales = await pool.query("SELECT id, project_code, name FROM we_projects WHERE sales_representative_id = $1", [adminId]);
        console.log(`Projects sales rep by admin: ${projectsSales.rowCount}`);
        projectsSales.rows.forEach(p => console.log(`  - [${p.project_code}] ${p.name}`));

        // 3. Check we_departments
        const deptsManaged = await pool.query("SELECT id, name FROM we_departments WHERE manager_id = $1", [adminId]);
        console.log(`Departments managed by admin: ${deptsManaged.rowCount}`);
        deptsManaged.rows.forEach(d => console.log(`  - ${d.name}`));

        // 4. Check we_project_md_estimations
        const mdEstimations = await pool.query("SELECT id, project_id FROM we_project_md_estimations WHERE created_by = $1", [adminId]);
        console.log(`M/D Estimations created by admin: ${mdEstimations.rowCount}`);

        // 5. Check vrb reviews
        try {
            const vrbReviews = await pool.query("SELECT id FROM we_vrb_reviews WHERE manager_id = $1", [adminId]);
            console.log(`VRB Reviews managed by admin: ${vrbReviews.rowCount}`);
        } catch (e) {
            // Table might not exist yet or different column name
        }

        try {
            const vrbEstimations = await pool.query("SELECT id FROM we_vrb_estimated_mm_items WHERE created_by = $1", [adminId]);
            console.log(`VRB M/M items created by admin: ${vrbEstimations.rowCount}`);
        } catch (e) { }

        console.log("--------------------------------------------------");
        console.log("Summary: Admin account is referenced in the above records.");

        await pool.end();
    } catch (error) {
        console.error("Check failed:", error);
        await pool.end();
    }
}

checkAdminUsage();
