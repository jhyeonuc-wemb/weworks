const { Pool } = require('pg');
const p = new Pool({ host: '115.21.12.186', port: 7432, database: 'weworks', user: 'weworks', password: 'weworks!1234' });

async function run() {
    await p.query(`
        CREATE TABLE IF NOT EXISTS we_contracts (
            id                    SERIAL PRIMARY KEY,
            project_id            INTEGER NOT NULL REFERENCES we_projects(id) ON DELETE CASCADE,
            contract_title        VARCHAR(500),
            supply_amount         BIGINT,
            stamp_duty            INTEGER,
            performance_bond_rate NUMERIC(5,2) DEFAULT 10,
            defect_bond_rate      NUMERIC(5,2) DEFAULT 2,
            payment_schedule      TEXT,
            contract_notes        TEXT,
            contract_date         DATE,
            contract_start_date   DATE,
            contract_end_date     DATE,
            created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await p.query('CREATE INDEX IF NOT EXISTS idx_contracts_project ON we_contracts(project_id)');

    const res = await p.query(`
        INSERT INTO we_contracts (
            project_id, supply_amount, stamp_duty,
            performance_bond_rate, defect_bond_rate,
            payment_schedule, contract_notes,
            contract_date, contract_start_date, contract_end_date
        )
        SELECT
            id, supply_amount, stamp_duty,
            COALESCE(performance_bond_rate, 10), COALESCE(defect_bond_rate, 2),
            payment_schedule, contract_notes,
            contract_date, contract_start_date, contract_end_date
        FROM we_projects
        WHERE supply_amount IS NOT NULL
           OR contract_date IS NOT NULL
           OR contract_start_date IS NOT NULL
        RETURNING id
    `);
    console.log('we_contracts created. Migrated rows:', res.rowCount);
    p.end();
}
run().catch(e => { console.error(e.message); p.end(); });
