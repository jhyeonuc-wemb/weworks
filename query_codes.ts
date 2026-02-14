import { query } from './lib/db';

async function run() {
    try {
        // Find CD_001_01
        const parentRes = await query("SELECT * FROM we_codes WHERE code = 'CD_001_01'");
        if (parentRes.rows.length === 0) {
            console.log("CD_001_01 not found");
            return;
        }
        const parentId = parentRes.rows[0].id;
        console.log("CD_001_01 found, ID:", parentId);

        // Find children
        const childrenRes = await query("SELECT * FROM we_codes WHERE parent_id = $1 ORDER BY display_order", [parentId]);
        console.log("Children of CD_001_01:", JSON.stringify(childrenRes.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
