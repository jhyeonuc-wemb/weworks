const { Pool } = require('pg');

const pool = new Pool({
  host: '115.21.12.186',
  port: 7432,
  database: 'weworks',
  user: 'weworks',
  password: 'weworks!1234',
});

async function testQuery() {
  const sql = `
      SELECT 
        u.id,
        u.username,
        u.name,
        u.email,
        u.employee_number,
        u.position,
        u.title,
        u.grade,
        u.department_id,
        d.name as department_name,
        u.role_id,
        (SELECT r.name FROM we_roles r WHERE r.id = u.role_id) as role_name,
        u.rank_id,
        rk.name as rank_name,
        rk.code as rank_code,
        rk.display_order as rank_order,
        u.status,
        u.phone,
        u.address,
        u.address_detail,
        u.joined_date,
        u.resignation_date,
        u.must_change_password,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ur.role_id,
              'name', r2.name,
              'is_primary', ur.is_primary
            ) ORDER BY ur.is_primary DESC, r2.name
          ) FILTER (WHERE ur.role_id IS NOT NULL),
          '[]'::json
        ) as roles
      FROM we_users u
      LEFT JOIN we_departments d ON u.department_id = d.id
      LEFT JOIN we_user_roles ur ON u.id = ur.user_id
      LEFT JOIN we_roles r2 ON ur.role_id = r2.id
      LEFT JOIN we_ranks rk ON u.rank_id = rk.id
      WHERE 1=1
      GROUP BY u.id, d.name, rk.name, rk.code, rk.display_order
      ORDER BY u.name
    `;

  try {
    const res = await pool.query(sql);
    console.log("Query successful", res.rowCount);
    await pool.end();
  } catch (e) {
    console.error("Query failed:", e.message);
    await pool.end();
  }
}

testQuery();
