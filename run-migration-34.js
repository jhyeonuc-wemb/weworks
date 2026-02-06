const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || '115.21.12.186',
    port: parseInt(process.env.DB_PORT || '7432'),
    database: process.env.DB_NAME || 'weworks',
    user: process.env.DB_USER || 'weworks',
    password: process.env.DB_PASSWORD || 'weworks!1234',
});

async function runMigration() {
    try {
        const migrationPath = path.join(process.cwd(), "database", "34_alter_vrb_add_ui_settings.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");
        console.log("Running migration 34...");
        await pool.query(sql);
        console.log("Migration 34 completed successfully.");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("Migration 34 failed:", error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
