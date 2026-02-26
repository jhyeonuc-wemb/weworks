import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: 전체 카테고리 + 항목 조회
export async function GET() {
    try {
        const catResult = await query(
            `SELECT id, label, overall_weight, display_order
             FROM we_difficulty_categories
             ORDER BY display_order ASC`
        );

        const itemResult = await query(
            `SELECT id, category_id, name, weight, guide_texts, display_order
             FROM we_difficulty_items
             ORDER BY category_id, display_order ASC`
        );

        const categories = catResult.rows.map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            overallWeight: parseFloat(cat.overall_weight),
            items: itemResult.rows
                .filter((item: any) => item.category_id === cat.id)
                .map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    weight: parseFloat(item.weight),
                    guide_texts: item.guide_texts || "",
                })),
        }));

        return NextResponse.json({ categories });
    } catch (error: any) {
        console.error("Error fetching difficulty checklist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 전체 카테고리 + 항목 저장 (upsert)
export async function PUT(request: Request) {
    try {
        const { categories } = await request.json();

        if (!Array.isArray(categories)) {
            return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
        }

        for (const cat of categories) {
            // 카테고리 overallWeight 업데이트
            await query(
                `UPDATE we_difficulty_categories
                 SET overall_weight = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [cat.overallWeight ?? 0, cat.id]
            );

            // 해당 카테고리 항목 전체 삭제 후 재삽입
            await query(
                `DELETE FROM we_difficulty_items WHERE category_id = $1`,
                [cat.id]
            );

            if (Array.isArray(cat.items) && cat.items.length > 0) {
                for (let i = 0; i < cat.items.length; i++) {
                    const item = cat.items[i];
                    await query(
                        `INSERT INTO we_difficulty_items (category_id, name, weight, guide_texts, display_order)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [cat.id, item.name || "", item.weight ?? 0, item.guide_texts || "", i]
                    );
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving difficulty checklist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
