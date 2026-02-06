
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
        const manpowerRes = await pool.query("SELECT id, affiliation_group, monthly_allocation FROM we_project_manpower_plan WHERE project_id = $1", [projectId]);

        for (const row of manpowerRes.rows) {
            if (row.affiliation_group && row.affiliation_group.startsWith('외주')) {
                console.log(`Updating Manpower ID: ${row.id} (${row.affiliation_group})`);
                const allocation = row.monthly_allocation || {};
                let modified = false;

                // Set 2026-01 to 2026-09 to 0
                for (let i = 1; i <= 9; i++) {
                    const month = `2026-${String(i).padStart(2, '0')}`;
                    if (allocation.hasOwnProperty(month)) {
                        allocation[month] = 0;
                        modified = true;
                    }
                }

                if (modified) {
                    await pool.query("UPDATE we_project_manpower_plan SET monthly_allocation = $1 WHERE id = $2", [JSON.stringify(allocation), row.id]);
                    console.log(`  Updated monthly_allocation for ${row.id}`);
                } else {
                    console.log(`  No 2026-01 to 2026-09 data for ${row.id}`);
                }
            }
        }

        // Also check if there's any expense item that matches the description
        const expenseRes = await pool.query("SELECT id, item, monthly_values FROM we_project_expense_plan WHERE project_id = $1", [projectId]);
        for (const row of expenseRes.rows) {
            if (row.item.includes('외주')) {
                console.log(`Updating Expense ID: ${row.id} (${row.item})`);
                const values = row.monthly_values || {};
                let modified = false;
                for (let i = 1; i <= 9; i++) {
                    const month = `2026-${String(i).padStart(2, '0')}`;
                    if (values.hasOwnProperty(month)) {
                        values[month] = 0;
                        modified = true;
                    }
                }
                if (modified) {
                    await pool.query("UPDATE we_project_expense_plan SET monthly_values = $1 WHERE id = $2", [JSON.stringify(values), row.id]);
                    console.log(`  Updated monthly_values for ${row.id}`);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
