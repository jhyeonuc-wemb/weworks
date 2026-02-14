
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

        // Check if columns exist first to avoid errors
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'we_project_profitability' 
      AND column_name IN ('analysis_start_date', 'analysis_end_date');
    `);

        if (res.rowCount < 2) {
            console.log("Adding columns analysis_start_date and analysis_end_date...");
            await client.query(`
        ALTER TABLE we_project_profitability
        ADD COLUMN IF NOT EXISTS analysis_start_date DATE,
        ADD COLUMN IF NOT EXISTS analysis_end_date DATE;
      `);
            console.log("Columns added.");
        } else {
            console.log("Columns already exist.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
