const { query } = require('./lib/db');

async function migrateStatuses() {
    try {
        // MD Estimation
        await query("UPDATE we_project_md_estimations SET status = 'STANDBY' WHERE status = 'draft'");
        await query("UPDATE we_project_md_estimations SET status = 'COMPLETED' WHERE status = 'completed'");

        // VRB Review
        await query("UPDATE we_project_vrb_reviews SET status = 'STANDBY' WHERE status = 'draft'");
        await query("UPDATE we_project_vrb_reviews SET status = 'COMPLETED' WHERE status = 'completed'");
        await query("UPDATE we_project_vrb_reviews SET status = 'COMPLETED' WHERE status = 'approved'");

        // Profitability
        await query("UPDATE we_project_profitability SET status = 'STANDBY' WHERE status = 'draft'");
        await query("UPDATE we_project_profitability SET status = 'COMPLETED' WHERE status = 'completed'");
        await query("UPDATE we_project_profitability SET status = 'COMPLETED' WHERE status = 'approved'");

        // Settlement
        await query("UPDATE we_project_settlement SET status = 'STANDBY' WHERE status = 'draft'");
        await query("UPDATE we_project_settlement SET status = 'COMPLETED' WHERE status = 'completed'");

        console.log("Migration completed.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

migrateStatuses();
