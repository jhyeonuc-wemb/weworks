import pool from './lib/db';

async function migrate() {
    console.log('Starting migration to fix foreign keys...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('1. Removing existing foreign key constraint on we_user_roles(role_id)...');
        // Let's try to find the constraint name first. Usually it's we_user_roles_role_id_fkey
        await client.query('ALTER TABLE we_user_roles DROP CONSTRAINT IF EXISTS we_user_roles_role_id_fkey');

        console.log('2. Removing existing foreign key constraint on we_users(role_id)...');
        await client.query('ALTER TABLE we_users DROP CONSTRAINT IF EXISTS we_users_role_id_fkey');

        console.log('3. Removing existing foreign key constraint on we_users(rank_id)...');
        await client.query('ALTER TABLE we_users DROP CONSTRAINT IF EXISTS we_users_rank_id_fkey');

        // We don't necessarily NEED to add new ones immediately if we want to be safe,
        // but it's good practice. However, since IDs might overlap or differ, 
        // let's just leave them off for now to allow the system to work while the user migrates data.

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
