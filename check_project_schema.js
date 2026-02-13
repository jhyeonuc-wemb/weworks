const { query } = require('./lib/db');

async function checkProjectSchema() {
    try {
        const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'we_projects'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkProjectSchema();
