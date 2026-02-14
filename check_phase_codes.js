const { query } = require('./lib/db');

async function checkCodes() {
    try {
        const res = await query(`
      SELECT p.code as parent_code, c.code, c.name, c.id
      FROM we_codes p
      JOIN we_codes c ON c.parent_id = p.id
      WHERE p.code IN ('MD_ESTIMATION', 'VRB', 'PROFITABILITY', 'SETTLEMENT')
      ORDER BY p.code, c.display_order
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkCodes();
