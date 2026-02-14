
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

        // Create table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS project_phase_statuses (
                id SERIAL PRIMARY KEY,
                project_phase_id INTEGER NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50),
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_phase_id, name)
            );
        `;
        await client.query(createTableSQL);
        console.log('Project Phase Statuses table created or already exists.');

        // Function to insert statuses for a phase
        const insertStatus = async (phaseCode, name, code, order) => {
            const phaseQuery = `SELECT id FROM project_phases WHERE code = $1`;
            const phaseRes = await client.query(phaseQuery, [phaseCode]);

            if (phaseRes.rows.length === 0) {
                console.log(`Phase not found: ${phaseCode}`);
                return;
            }

            const phaseId = phaseRes.rows[0].id;

            const insertSQL = `
                INSERT INTO project_phase_statuses (project_phase_id, name, code, sort_order)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (project_phase_id, name) DO NOTHING
            `;
            await client.query(insertSQL, [phaseId, name, code, order]);
            console.log(`Inserted status '${name}' for phase '${phaseCode}'`);
        };

        // M/D Estimation
        await insertStatus('md_estimation', '대기', 'standby', 1);
        await insertStatus('md_estimation', '작성', 'in_progress', 2);
        await insertStatus('md_estimation', '완료', 'completed', 3);

        // VRB
        await insertStatus('vrb', '대기', 'standby', 1);
        await insertStatus('vrb', '작성', 'in_progress', 2);
        await insertStatus('vrb', '완료', 'completed', 3);

        // Profitability
        await insertStatus('profitability', '대기', 'standby', 1);
        await insertStatus('profitability', '작성', 'in_progress', 2);
        await insertStatus('profitability', '완료', 'completed', 3);

        // Settlement
        await insertStatus('settlement', '대기', 'standby', 1);
        await insertStatus('settlement', '작성', 'in_progress', 2);
        await insertStatus('settlement', '완료', 'completed', 3);

        console.log('All initial phase statuses populated.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
