
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
        const projectId = 6;
        const expenseRes = await pool.query("SELECT id, category, item, monthly_values FROM we_project_expense_plan WHERE project_id = $1", [projectId]);
        console.log('Expense Plan Items:');
        expenseRes.rows.forEach(row => {
            console.log(`- ID: ${row.id}, Category: ${row.category}, Item: ${row.item}`);
            if (row.item.includes('외주')) {
                console.log(`  Values: ${JSON.stringify(row.monthly_values)}`);
            }
        });

        const manpowerRes = await pool.query("SELECT id, affiliation_group, name FROM we_project_manpower_plan WHERE project_id = $1", [projectId]);
        console.log('\nManpower Plan Items:');
        manpowerRes.rows.forEach(row => {
            console.log(`- ID: ${row.id}, Group: ${row.affiliation_group}, Name: ${row.name}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
