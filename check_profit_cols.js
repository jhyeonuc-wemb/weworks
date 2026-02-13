const { query } = require('./lib/db');
async function run() {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'we_project_profitability'");
    console.log(res.rows);
    process.exit();
}
run();
