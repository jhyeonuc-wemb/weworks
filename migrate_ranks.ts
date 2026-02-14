import { query } from './lib/db';

async function run() {
    try {
        console.log("Starting migration of rank_id to use we_codes...");

        // 1. Get existing ranks
        const ranksRes = await query("SELECT * FROM we_ranks");
        const ranks = ranksRes.rows;
        console.log(`Found ${ranks.length} existing ranks.`);

        // 2. Get codes for CD_001_01
        // First find parent id
        const parentRes = await query("SELECT id FROM we_codes WHERE code = 'CD_001_01'");
        if (parentRes.rows.length === 0) {
            console.error("CD_001_01 not found!");
            process.exit(1);
        }
        const parentId = parentRes.rows[0].id;

        const codesRes = await query("SELECT * FROM we_codes WHERE parent_id = $1", [parentId]);
        const codes = codesRes.rows;
        console.log(`Found ${codes.length} target codes.`);

        // 3. Create mapping
        const mapping = new Map();
        for (const rank of ranks) {
            const targetCode = codes.find(c => c.name === rank.name);
            if (targetCode) {
                console.log(`Mapping '${rank.name}' (Old ID: ${rank.id}) -> (New ID: ${targetCode.id})`);
                mapping.set(String(rank.id), String(targetCode.id));
            } else {
                console.warn(`WARNING: No matching code found for rank '${rank.name}'`);
            }
        }

        // 4. Update users
        console.log("Updating users...");

        // We need to drop the FK constraint first because we are changing values to IDs that might not exist in we_ranks
        await query("ALTER TABLE we_users DROP CONSTRAINT IF EXISTS we_users_rank_id_fkey");
        console.log("Dropped old FK constraint.");

        const usersRes = await query("SELECT id, rank_id FROM we_users WHERE rank_id IS NOT NULL");
        const users = usersRes.rows;
        let updateCount = 0;

        for (const user of users) {
            const oldId = String(user.rank_id);
            if (mapping.has(oldId)) {
                const newId = mapping.get(oldId);
                if (newId !== oldId) {
                    await query("UPDATE we_users SET rank_id = $1 WHERE id = $2", [newId, user.id]);
                    updateCount++;
                }
            } else {
                console.warn(`User ${user.id} has rank_id ${user.rank_id} which is not in mapping.`);
            }
        }
        console.log(`Updated ${updateCount} users.`);

        // 5. Add new FK constraint to we_codes
        await query("ALTER TABLE we_users ADD CONSTRAINT we_users_rank_id_fkey FOREIGN KEY (rank_id) REFERENCES we_codes(id)");
        console.log("Added new FK constraint to we_codes.");

        console.log("Migration complete.");

    } catch (e) {
        console.error("Migration failed:", e);
    }
}

run();
