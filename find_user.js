const { query } = require('./lib/db');

async function findUser() {
    try {
        const res = await query("SELECT id FROM we_users WHERE name = '정현우'");
        console.log(JSON.stringify(res.rows));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findUser();
