const { query } = require('./lib/db');

async function check() {
    try {
        const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'we_project_profitability'
    `);
        console.log('COLUMNS:', JSON.stringify(tableInfo.rows));

        const projectCheck = await query('SELECT id FROM we_projects LIMIT 1');
        if (projectCheck.rows.length === 0) {
            console.log('No projects found');
            return;
        }
        const pid = projectCheck.rows[0].id;
        console.log('Testing with project ID:', pid);

        const checkDraft = await query(
            "SELECT id, version FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress', 'draft')",
            [pid]
        );
        console.log('Found draft:', checkDraft.rows.length);

        // Try a test insert in a transaction so we can rollback
        await query('BEGIN');
        try {
            const res = await query(
                "INSERT INTO we_project_profitability (project_id, version, status, created_by, version_comment) VALUES ($1, 999, 'not_started', 1, 'test') RETURNING id",
                [pid]
            );
            console.log('Test insert successful, ID:', res.rows[0].id);
        } catch (e) {
            console.error('Test insert FAILED:', e.message);
        } finally {
            await query('ROLLBACK');
        }

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
