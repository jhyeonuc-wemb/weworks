const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const client = new Client({
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    database: envConfig.DB_NAME,
    user: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    ssl: false
});

async function main() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, name, parent_department_id FROM we_departments ORDER BY id');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
