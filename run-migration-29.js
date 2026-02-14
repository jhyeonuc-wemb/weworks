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
        const migrationPath = path.join(process.cwd(), "database", "29_alter_vrb_add_external_purchase2_fields.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");
        console.log("Running migration 29...");
        await pool.query(sql);
        console.log("Migration 29 completed successfully.");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("Migration 29 failed:", error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
