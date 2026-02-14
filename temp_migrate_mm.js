const { query } = require("./lib/db");

async function migrate() {
    try {
        console.log("Checking columns for we_project_settlement...");

        // Add planned M/M columns to we_project_settlement
        await query(`
      ALTER TABLE we_project_settlement 
      ADD COLUMN IF NOT EXISTS planned_svc_mm_own DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS planned_svc_mm_ext DECIMAL(10, 2) DEFAULT 0
    `);

        console.log("Migration successful");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
