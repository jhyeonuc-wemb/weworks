const pool = require('./lib/db');

(async () => {
    try {
        const r = await pool.query('SELECT id FROM project_phases ORDER BY display_order ASC, id ASC');
        for (let i = 0; i < r.rows.length; i++) {
            await pool.query('UPDATE project_phases SET display_order = $1 WHERE id = $2', [i + 1, r.rows[i].id]);
        }
        const check = await pool.query('SELECT display_order, name, phase_group FROM project_phases ORDER BY display_order');
        check.rows.forEach(row => console.log(row.display_order, row.name, row.phase_group));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
