const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234'
});

async function run() {
    const projectId = 4;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get estimation IDs for this project
        const res = await client.query('SELECT id FROM we_project_md_estimations WHERE project_id = $1', [projectId]);
        const estimationIds = res.rows.map(row => row.id);
        console.log(`Found ${estimationIds.length} estimations for project ${projectId}. IDs: ${estimationIds.join(', ')}`);

        if (estimationIds.length > 0) {
            // 2. Delete child tables (using WHERE id or estimation_id IN (...))
            // Since I don't know the exact foreign key structure (cascade or not), I will try deleting from the parent table.
            // If that fails, I'll need to delete children first.
            // Assuming typical setup, let's try deleting children explicitly to be safe.

            // Dependencies:
            // we_project_md_estimation_difficulties
            // we_project_md_estimation_field_categories (might be directly on estimation or separate)
            // we_project_md_estimation_development_items
            // we_project_md_estimation_modeling_3d_items
            // we_project_md_estimation_pid_items

            // Note: Check constraints/foreign keys if known. 
            // Based on typical schema:

            console.log('Deleting from we_project_md_estimation_difficulties...');
            await client.query('DELETE FROM we_project_md_estimation_difficulties WHERE estimation_id = ANY($1)', [estimationIds]);

            console.log('Deleting from we_project_md_estimation_field_categories...');
            // Check if this table uses estimation_id
            await client.query('DELETE FROM we_project_md_estimation_field_categories WHERE estimation_id = ANY($1)', [estimationIds]);

            console.log('Deleting from we_project_md_estimation_development_items...');
            await client.query('DELETE FROM we_project_md_estimation_development_items WHERE estimation_id = ANY($1)', [estimationIds]);

            console.log('Deleting from we_project_md_estimation_modeling_3d_items...');
            await client.query('DELETE FROM we_project_md_estimation_modeling_3d_items WHERE estimation_id = ANY($1)', [estimationIds]);

            console.log('Deleting from we_project_md_estimation_pid_items...');
            await client.query('DELETE FROM we_project_md_estimation_pid_items WHERE estimation_id = ANY($1)', [estimationIds]);

            // 3. Delete parent estimations
            console.log('Deleting from we_project_md_estimations...');
            await client.query('DELETE FROM we_project_md_estimations WHERE id = ANY($1)', [estimationIds]);
        }

        // Also reset project status? User said "initialize state". 
        // Usually means going back to 'sales' phase if it was advanced by MD estimation.
        // Check current status
        const projRes = await client.query('SELECT status, current_phase FROM we_projects WHERE id = $1', [projectId]);
        if (projRes.rows.length > 0) {
            // If status was advanced by MD estimation completion (e.g. md_estimated), revert it.
            // But if it's already past that (e.g. vrb_approved), maybe we shouldn't?
            // User said "initialization state". Safest is to just clear the MD data.
            // But if the project status depends on MD estimation being done, it might be in an invalid state.
            // Let's just clear MD data for now as requested ("MD data ... delete all and initialize state").
            // Initialize state likely refers to the MD Estimation screen state (which we handled in UI), 
            // but physically deleting the rows achieves "un-filled" state.
            // I will trigger an update to project status if it was 'md_estimated' back to 'sales' or similar?
            // Let's stick to deleting MD data.
        }

        await client.query('COMMIT');
        console.log('Successfully deleted MD estimation data.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting data (rolled back):', err);
    } finally {
        client.release();
        pool.end();
    }
}
run();
