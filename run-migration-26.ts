import { query } from "./lib/db";
import fs from "fs";
import path from "path";

async function runMigration() {
    try {
        const migrationPath = path.join(process.cwd(), "database", "26_create_profitability_extra_revenue_table.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");
        console.log("Running migration...");
        await query(sql);
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
