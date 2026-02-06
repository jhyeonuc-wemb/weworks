const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || '115.21.12.186',
    port: parseInt(process.env.DB_PORT || '7432'),
    database: process.env.DB_NAME || 'weworks',
    user: process.env.DB_USER || 'weworks',
    password: process.env.DB_PASSWORD || 'weworks!1234',
});

const query = `
      SELECT 
        p.id,
        p.project_code,
        p.name,
        p.status,
        p.current_phase,
        p.process_status,
        p.risk_level,
        p.contract_start_date,
        p.contract_end_date,
        p.currency,
        p.expected_amount,
        pc.name as category_name,
        c.name as customer_name,
        o.name as orderer_name,
        u1.name as manager_name,
        u2.name as sales_representative_name,
        p.created_at,
        prof.status as profitability_status,
        prof.net_profit,
        prof.profit_rate,
        CASE
          WHEN prof.status IN ('draft', 'review', 'in_progress') THEN 'profitability'
          WHEN prof.status = 'approved' THEN 'completed'
          ELSE COALESCE(p.current_phase, 'sales')
        END as computed_phase
      FROM we_projects p
      LEFT JOIN we_project_categories pc ON p.category_id = pc.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      LEFT JOIN we_clients o ON p.orderer_id = o.id
      LEFT JOIN we_users u1 ON p.manager_id = u1.id
      LEFT JOIN we_users u2 ON p.sales_representative_id = u2.id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id)
          project_id,
          status,
          net_profit,
          profit_rate
        FROM we_project_profitability
        ORDER BY project_id, version DESC
      ) prof ON p.id = prof.project_id
      WHERE 1=1
      ORDER BY p.created_at DESC
`;

pool.query(query)
    .then(res => {
        console.log(`Success! Rows: ${res.rowCount}`);
        console.log(res.rows.slice(0, 1));
        pool.end();
    })
    .catch(err => {
        console.error('Query Error:', err);
        pool.end();
    });
