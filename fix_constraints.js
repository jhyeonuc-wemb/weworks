const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function migrate() {
    console.log('Starting migration to fix foreign keys...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('1. Removing existing foreign key constraint on we_user_roles(role_id)...');
        await client.query('ALTER TABLE we_user_roles DROP CONSTRAINT IF EXISTS we_user_roles_role_id_fkey');

        console.log('2. Removing existing foreign key constraint on we_users(role_id)...');
        await client.query('ALTER TABLE we_users DROP CONSTRAINT IF EXISTS we_users_role_id_fkey');

        console.log('3. Removing existing foreign key constraint on we_users(rank_id)...');
        await client.query('ALTER TABLE we_users DROP CONSTRAINT IF EXISTS we_users_rank_id_fkey');

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

migrate();
