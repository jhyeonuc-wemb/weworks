const { query } = require('./lib/db');
async function run() {
    const r1 = await query("UPDATE project_phases SET is_active = false WHERE code = 'md_estimation' RETURNING code, is_active");
    console.log('phases updated:', JSON.stringify(r1.rows));
    const r2 = await query("DELETE FROM we_project_phase_progress WHERE phase_code = 'md_estimation' RETURNING project_id, phase_code");
    console.log('phase_progress cleaned:', r2.rows.length, 'rows deleted');
}
run().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
