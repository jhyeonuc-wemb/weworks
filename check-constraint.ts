import { query } from "./lib/db";

async function checkConstraint() {
    try {
        const res = await query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'we_project_profitability'::regclass 
      AND contype = 'c'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkConstraint();
