import { query } from "./lib/db";
import fs from "fs";
import path from "path";

async function runMigration() {
    try {
        const migrationPath = path.join(process.cwd(), "database", "29_alter_vrb_add_external_purchase2_fields.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");
        console.log("Running migration 29...");
        await query(sql);
        console.log("Migration 29 completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration 29 failed:", error);
        process.exit(1);
    }
}

runMigration();
