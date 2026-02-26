const db = require('./lib/db');

async function deleteProfitabilityV2() {
    try {
        console.log("=== Deleting Profitability Version 2 of Project P25-018 ===");

        // 이전에 확인된 데이터 기반
        const projectId = 12;
        const profitabilityId = 11; // v2 ID

        // 1. Delete details (just in case, though we checked they are empty)
        await db.query("DELETE FROM we_project_manpower_plan WHERE profitability_id = $1", [profitabilityId]);
        await db.query("DELETE FROM we_project_product_plan WHERE profitability_id = $1", [profitabilityId]);
        await db.query("DELETE FROM we_project_expense_plan WHERE profitability_id = $1", [profitabilityId]);
        await db.query("DELETE FROM we_project_profitability_extra_revenue WHERE profitability_id = $1", [profitabilityId]);

        // 2. Delete the version header
        const delRes = await db.query(
            "DELETE FROM we_project_profitability WHERE id = $1 RETURNING *",
            [profitabilityId]
        );

        if (delRes.rows.length > 0) {
            console.log(`Successfully deleted version 2 (ID: ${profitabilityId}).`);
        } else {
            console.log("Could not find or delete version 2.");
        }
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        process.exit(0);
    }
}

deleteProfitabilityV2();
