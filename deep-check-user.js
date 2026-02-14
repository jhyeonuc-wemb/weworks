const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || '115.21.12.186',
    port: parseInt(process.env.DB_PORT || '7432'),
    database: process.env.DB_NAME || 'weworks',
    user: process.env.DB_USER || 'weworks',
    password: process.env.DB_PASSWORD || 'weworks!1234',
});

async function deepCheck(userId) {
    try {
        console.log(`Deep checking usage for user ID: ${userId}`);

        const tables = [
            { name: 'we_projects', cols: ['created_by', 'manager_id', 'sales_representative_id'] },
            { name: 'we_departments', cols: ['manager_id'] },
            { name: 'we_project_md_estimations', cols: ['created_by'] },
            { name: 'we_vrb_reviews', cols: ['manager_id', 'created_by'] },
            { name: 'we_vrb_review_logs', cols: ['created_by'] },
            { name: 'we_vrb_estimated_mm_items', cols: ['created_by'] },
            { name: 'we_product_plan', cols: ['created_by'] },
            { name: 'we_manpower_plan', cols: ['created_by'] },
            { name: 'we_project_expense_plan', cols: ['created_by'] },
            { name: 'we_profitability_extra_revenue', cols: ['created_by'] },
            { name: 'we_settlements', cols: ['created_by'] },
            { name: 'we_project_team_assignments', cols: ['user_id', 'created_by'] }
        ];

        for (const table of tables) {
            for (const col of table.cols) {
                try {
                    const res = await pool.query(`SELECT count(*) FROM ${table.name} WHERE ${col} = $1`, [userId]);
                    const count = parseInt(res.rows[0].count);
                    if (count > 0) {
                        console.log(`- ${table.name}.${col}: ${count} records`);
                    }
                } catch (e) {
                    // console.log(`Table/Col ${table.name}.${col} not found or error.`);
                }
            }
        }

        await pool.end();
    } catch (error) {
        console.error("Check failed:", error);
        await pool.end();
    }
}

deepCheck(1);
