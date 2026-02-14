
const { query } = require("./lib/db");

async function updateSchema() {
    try {
        console.log("Starting schema update for profitability versioning...");

        // 1. we_project_profitability 에 코멘트 컬럼 추가
        await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'we_project_profitability' AND column_name = 'version_comment') THEN
          ALTER TABLE we_project_profitability ADD COLUMN version_comment TEXT;
        END IF;
      END $$;
    `);

        // 2. 자식 테이블들에 profitability_id 컬럼 추가
        const childTables = [
            'we_project_manpower_plan',
            'we_project_product_plan',
            'we_project_expense_plan',
            'we_project_profitability_extra_revenue',
            'we_project_order_proposal'
        ];

        for (const table of childTables) {
            await query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'profitability_id') THEN
            ALTER TABLE ${table} ADD COLUMN profitability_id BIGINT REFERENCES we_project_profitability(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `);
        }

        // 3. 기존 데이터 마이그레이션
        await query(`
      DO $$
      DECLARE
          rec RECORD;
          latest_prof_id BIGINT;
      BEGIN
          FOR rec IN SELECT DISTINCT project_id FROM we_project_profitability LOOP
              SELECT id INTO latest_prof_id FROM we_project_profitability WHERE project_id = rec.project_id ORDER BY version DESC LIMIT 1;
              
              UPDATE we_project_manpower_plan SET profitability_id = latest_prof_id WHERE project_id = rec.project_id AND profitability_id IS NULL;
              UPDATE we_project_product_plan SET profitability_id = latest_prof_id WHERE project_id = rec.project_id AND profitability_id IS NULL;
              UPDATE we_project_expense_plan SET profitability_id = latest_prof_id WHERE project_id = rec.project_id AND profitability_id IS NULL;
              UPDATE we_project_profitability_extra_revenue SET profitability_id = latest_prof_id WHERE project_id = rec.project_id AND profitability_id IS NULL;
              UPDATE we_project_order_proposal SET profitability_id = latest_prof_id WHERE project_id = rec.project_id AND profitability_id IS NULL;
          END LOOP;
      END $$;
    `);

        // 4. 제약 조건 업데이트
        // we_project_expense_plan: UNIQUE(project_id, category, item) -> UNIQUE(profitability_id, category, item)
        await query(`
      ALTER TABLE we_project_expense_plan DROP CONSTRAINT IF EXISTS we_project_expense_plan_project_id_category_item_key;
      -- Note: profitability_id might have NULLs if migration failed for some records, but we should make it NOT NULL after migration
      -- ALTER TABLE we_project_expense_plan ALTER COLUMN profitability_id SET NOT NULL;
      -- But let's skip NOT NULL for now to be safe.
      CREATE UNIQUE INDEX IF NOT EXISTS idx_we_expense_plan_profitability_unique ON we_project_expense_plan(profitability_id, category, item);
    `);

        // we_project_profitability_extra_revenue: UNIQUE(project_id) -> UNIQUE(profitability_id)
        await query(`
      ALTER TABLE we_project_profitability_extra_revenue DROP CONSTRAINT IF EXISTS we_project_profitability_extra_revenue_project_id_key;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_we_pper_profitability_unique ON we_project_profitability_extra_revenue(profitability_id);
    `);

        // we_project_order_proposal: UNIQUE(project_id) -> UNIQUE(profitability_id)
        await query(`
      ALTER TABLE we_project_order_proposal DROP CONSTRAINT IF EXISTS we_project_order_proposal_project_id_key;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_we_pop_profitability_unique ON we_project_order_proposal(profitability_id);
    `);

        console.log("Schema update completed successfully.");
    } catch (error) {
        console.error("Error updating schema:", error);
    } finally {
        process.exit();
    }
}

updateSchema();
