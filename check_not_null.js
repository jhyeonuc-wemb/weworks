const { query } = require('./lib/db');

async function checkNotNull() {
    const res = await query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'we_project_profitability' 
    AND is_nullable = 'NO'
  `);
    console.log('NOT NULL columns:', JSON.stringify(res.rows));
    process.exit();
}

checkNotNull();
