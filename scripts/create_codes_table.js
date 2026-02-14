
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
        console.log('Connected to database');

        const sql = `
            CREATE TABLE IF NOT EXISTS we_codes (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER REFERENCES we_codes(id) ON DELETE CASCADE,
                code VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(parent_id, code)
            );
        `;

        await client.query(sql);
        console.log('Table we_codes created or already exists');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await client.end();
    }
}

run();
