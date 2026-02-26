const db = require('./lib/db');

async function checkProjectData() {
    const result = { project: null, versions: [] };
    try {
        const projectRes = await db.query(
            "SELECT id, name, status, current_phase FROM we_projects WHERE project_code = $1",
            ['P25-018']
        );
        if (projectRes.rows.length === 0) return console.log(JSON.stringify({ error: "No project found" }));
        result.project = projectRes.rows[0];

        const profRes = await db.query(
            "SELECT id, version, status, created_at FROM we_project_profitability WHERE project_id = $1 ORDER BY version ASC",
            [result.project.id]
        );

        for (const prof of profRes.rows) {
            const v = { info: prof, manpower: 0, product: 0, expense: 0, extraRevenue: 0 };
            v.manpower = (await db.query("SELECT COUNT(*) FROM we_project_manpower_plan WHERE profitability_id = $1", [prof.id])).rows[0].count;
            v.product = (await db.query("SELECT COUNT(*) FROM we_project_product_plan WHERE profitability_id = $1", [prof.id])).rows[0].count;
            v.expense = (await db.query("SELECT COUNT(*) FROM we_project_expense_plan WHERE profitability_id = $1", [prof.id])).rows[0].count;
            v.extraRevenue = (await db.query("SELECT COUNT(*) FROM we_project_profitability_extra_revenue WHERE profitability_id = $1", [prof.id])).rows[0].count;
            result.versions.push(v);
        }

        console.log("=== JSON_RESULT_START ===");
        console.log(JSON.stringify(result, null, 2));
        console.log("=== JSON_RESULT_END ===");
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        process.exit(0);
    }
}

checkProjectData();
