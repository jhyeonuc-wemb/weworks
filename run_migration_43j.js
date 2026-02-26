const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration 43j: Reload field difficulty items from we_md_field_difficulty_items...');

        // 1. 공통 난이도 카테고리 ID 확인
        const commonCatRes = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development_common_weight'`);
        if (commonCatRes.rows.length === 0) {
            throw new Error('development_common_weight category not found. Run migration 43i first.');
        }
        const commonCatId = commonCatRes.rows[0].id;

        // 2. 분야별 난이도 카테고리 ID 확인
        const fieldCatRes = await client.query(`SELECT id FROM we_md_categories WHERE code = 'development_field_weight'`);
        if (fieldCatRes.rows.length === 0) {
            throw new Error('development_field_weight category not found. Run migration 43i first.');
        }
        const fieldCatId = fieldCatRes.rows[0].id;

        // 3. 분야별 난이도 기존 항목 삭제
        await client.query(`DELETE FROM we_md_items WHERE category_id = $1`, [fieldCatId]);
        console.log('✔ Cleared development_field_weight items');

        // 4. we_md_field_difficulty_items에서 실제 VRB 데이터 읽기
        const fieldItems = await client.query(
            `SELECT field_category, content, description, display_order
             FROM we_md_field_difficulty_items
             WHERE is_active = true
             ORDER BY display_order, id`
        );
        console.log(`✔ Found ${fieldItems.rows.length} field difficulty items from we_md_field_difficulty_items`);

        // 5. we_md_items에 삽입 (item_category = field_category)
        for (let i = 0; i < fieldItems.rows.length; i++) {
            const row = fieldItems.rows[i];
            await client.query(
                `INSERT INTO we_md_items (category_id, item_category, content, description, standard_md, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [fieldCatId, row.field_category, row.content, row.description || '', 0, i]
            );
        }
        console.log(`✔ Inserted ${fieldItems.rows.length} field difficulty items into development_field_weight`);

        // 6. 공통 난이도도 we_md_difficulty_items에서 다시 읽기 (있으면)
        try {
            const commonCheck = await client.query(`SELECT to_regclass('public.we_md_difficulty_items') AS exists`);
            if (commonCheck.rows[0].exists) {
                const commonItems = await client.query(
                    `SELECT category, content, description, display_order
                     FROM we_md_difficulty_items
                     WHERE is_active = true
                     ORDER BY display_order, id`
                );
                if (commonItems.rows.length > 0) {
                    await client.query(`DELETE FROM we_md_items WHERE category_id = $1`, [commonCatId]);
                    for (let i = 0; i < commonItems.rows.length; i++) {
                        const row = commonItems.rows[i];
                        await client.query(
                            `INSERT INTO we_md_items (category_id, item_category, content, description, standard_md, sort_order)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [commonCatId, row.category, row.content, row.description || '', 0, i]
                        );
                    }
                    console.log(`✔ Also refreshed ${commonItems.rows.length} common difficulty items from we_md_difficulty_items`);
                }
            }
        } catch (e) {
            console.log('ℹ common difficulty items kept from previous migration (no we_md_difficulty_items table)');
        }

        console.log('✅ Migration 43j complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
