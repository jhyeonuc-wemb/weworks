
const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function run() {
    try {
        console.log('Finding project ID for P25-013...');
        const projectRes = await pool.query("SELECT id FROM we_projects WHERE project_code = 'P25-013'");
        if (projectRes.rows.length === 0) {
            console.log('Project not found');
            return;
        }
        const projectId = projectRes.rows[0].id;
        console.log('Project ID:', projectId);

        console.log('\n--- Manpower Plan ---');
        const manpowerRes = await pool.query("SELECT id, affiliation_group, name, monthly_allocation FROM we_project_manpower_plan WHERE project_id = $1", [projectId]);
        manpowerRes.rows.forEach(row => {
            console.log(`ID: ${row.id}, Group: ${row.affiliation_group}, Name: ${row.name}, Allocation: ${JSON.stringify(row.monthly_allocation)}`);
        });

        console.log('\n--- Expense Plan ---');
        const expenseRes = await pool.query("SELECT id, category, item, monthly_values FROM we_project_expense_plan WHERE project_id = $1", [projectId]);
        expenseRes.rows.forEach(row => {
            console.log(`ID: ${row.id}, Category: ${row.category}, Item: ${row.item}, Values: ${JSON.stringify(row.monthly_values)}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
