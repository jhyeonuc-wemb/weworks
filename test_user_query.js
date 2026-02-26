const { query } = require('./lib/db');

async function testQuery() {
    const sql = `
      WITH RECURSIVE dept_tree AS (
        SELECT id, name, parent_department_id, display_order, 
               CAST(LPAD(COALESCE(display_order, 0)::text, 5, '0') || '_' || name AS text) as path
        FROM we_departments
        WHERE parent_department_id IS NULL
        UNION ALL
        SELECT d.id, d.name, d.parent_department_id, d.display_order,
               dt.path || ' > ' || LPAD(COALESCE(d.display_order, 0)::text, 5, '0') || '_' || d.name
        FROM we_departments d
        JOIN dept_tree dt ON d.parent_department_id = dt.id
      )
      SELECT 
        u.id, u.name, dt.name as department_name, dt.path as dept_path,
        rk.name as rank_name, rk.display_order as rank_order, u.title
      FROM we_users u
      LEFT JOIN dept_tree dt ON u.department_id = dt.id
      LEFT JOIN we_codes rk ON u.rank_id = rk.id
      ORDER BY 
        COALESCE(dt.path, 'ZZZZZ') ASC, 
        (CASE WHEN u.title IS NOT NULL AND u.title <> '' THEN 0 ELSE 1 END) ASC,
        COALESCE(rk.display_order, 999) ASC, 
        u.title ASC,
        u.name ASC
      LIMIT 100;
    `;

    try {
        const res = await query(sql, []);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    }
}

testQuery();
