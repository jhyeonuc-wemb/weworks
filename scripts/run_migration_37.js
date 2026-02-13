
const { query } = require('../lib/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const migrationFile = path.resolve(__dirname, '../database/37_update_project_category_and_field.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Running migration...');
        const result = await query(sql);
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
