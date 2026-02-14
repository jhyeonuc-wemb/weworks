const { query } = require('./lib/db');
async function test() {
    const res = await query("SELECT name FROM we_departments WHERE name LIKE '%위엠비%' OR name LIKE '(%)%'");
    console.log(res.rows);
}
test();
