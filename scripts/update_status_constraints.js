
const { Client } = require('pg');

const client = new Client({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        const commonStatuses = "'STANDBY', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED'";

        // Define tables and their specific legacy statuses to keep + new statuses
        const updates = [
            {
                table: 'we_project_md_estimations',
                constraint: 'we_project_md_estimations_status_check',
                statuses: `${commonStatuses}, 'draft', 'completed', 'approved'`
            },
            {
                table: 'we_project_vrb_reviews',
                constraint: 'we_project_vrb_reviews_status_check',
                statuses: `${commonStatuses}, 'draft', 'submitted', 'approved', 'rejected'`
            },
            {
                table: 'we_project_profitability',
                constraint: 'we_project_profitability_status_check',
                statuses: `${commonStatuses}, 'draft', 'review', 'approved', 'rejected', 'completed', 'not_started', 'in_progress'`
            },
            {
                table: 'we_project_settlement', // Note singular naming in creation script
                constraint: 'we_project_settlement_status_check',
                statuses: `${commonStatuses}, 'draft', 'completed'`
            }
        ];

        await client.query('BEGIN');

        for (const update of updates) {
            console.log(`Updating ${update.table}...`);

            // Drop existing constraint
            await client.query(`ALTER TABLE ${update.table} DROP CONSTRAINT IF EXISTS ${update.constraint}`);
            console.log(`  Dropped constraint ${update.constraint}`);

            // Add new constraint
            const query = `ALTER TABLE ${update.table} ADD CONSTRAINT ${update.constraint} CHECK (status IN (${update.statuses}))`;
            await client.query(query);
            console.log(`  Added new constraint with statuses: ${update.statuses}`);
        }

        await client.query('COMMIT');
        console.log('All status constraints updated successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating status constraints:', err);
    } finally {
        await client.end();
    }
}

run();
