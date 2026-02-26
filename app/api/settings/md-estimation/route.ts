import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: 전체 카테고리 + 항목 조회
export async function GET() {
    try {
        const catResult = await query(
            `SELECT id, code, name, overall_weight, sort_order
             FROM we_md_categories
             ORDER BY sort_order ASC`
        );

        const itemResult = await query(
            `SELECT id, category_id, item_category, classification, content, description, standard_md, sort_order
             FROM we_md_items
             ORDER BY category_id ASC, sort_order ASC`
        );

        const categories = catResult.rows.map((cat: any) => ({
            id: Number(cat.id),
            code: cat.code,
            name: cat.name,
            overallWeight: parseFloat(cat.overall_weight) || 0,
            items: itemResult.rows
                .filter((item: any) => Number(item.category_id) === Number(cat.id))
                .map((item: any) => ({
                    id: Number(item.id),
                    classification: item.classification || "",
                    itemCategory: item.item_category || "",
                    content: item.content,
                    description: item.description || "",
                    standardMd: parseFloat(item.standard_md),
                })),
        }));

        return NextResponse.json({ categories });
    } catch (error: any) {
        console.error("Error fetching md-estimation settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 전체 카테고리 항목 저장 (카테고리별 DELETE + INSERT)
export async function PUT(request: Request) {
    try {
        const { categories } = await request.json();

        if (!Array.isArray(categories)) {
            return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
        }

        for (const cat of categories) {
            // 카테고리 가중치 업데이트
            await query(
                `UPDATE we_md_categories SET overall_weight = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [cat.overallWeight ?? 0, cat.id]
            );

            // 해당 카테고리 항목 전체 삭제 후 재삽입
            await query(
                `DELETE FROM we_md_items WHERE category_id = $1`,
                [cat.id]
            );

            if (Array.isArray(cat.items) && cat.items.length > 0) {
                for (let i = 0; i < cat.items.length; i++) {
                    const item = cat.items[i];
                    await query(
                        `INSERT INTO we_md_items (category_id, classification, item_category, content, description, standard_md, sort_order)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [cat.id, item.classification, item.itemCategory || "", item.content, item.description || "", item.standardMd, i]
                    );
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving md-estimation settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
