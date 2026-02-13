const { query } = require('./lib/db');
async function run() {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%settlement%'");
    console.log(res.rows);
    process.exit();
}
run();
