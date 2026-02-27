import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: vrb_id 기준 M/D 수량 데이터 조회 (스냅샷 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [qtyResult, extraResult] = await Promise.all([
            query(
                `SELECT item_id, quantity, calculated_md,
                        classification, content, standard_md, category_code, category_name
                 FROM we_project_md_quantities WHERE vrb_id = $1`,
                [id]
            ),
            query(
                `SELECT id, classification, content, standard_md, quantity, calculated_md, sort_order
                 FROM we_project_md_extra_items
                 WHERE vrb_id = $1 ORDER BY sort_order, id`,
                [id]
            ),
        ]);

        return NextResponse.json({
            quantities: qtyResult.rows.map((r: any) => ({
                itemId: Number(r.item_id),
                quantity: parseFloat(r.quantity) || 0,
                calculatedMd: parseFloat(r.calculated_md) || 0,
                // 스냅샷
                classification: r.classification || '',
                content: r.content || '',
                standardMd: parseFloat(r.standard_md) || 0,
                categoryCode: r.category_code || '',
                categoryName: r.category_name || '',
            })),
            extraItems: extraResult.rows.map((r: any) => ({
                id: Number(r.id),
                classification: r.classification || '',
                content: r.content || '',
                standardMd: parseFloat(r.standard_md) || 0,
                quantity: parseFloat(r.quantity) || 0,
                calculatedMd: parseFloat(r.calculated_md) || 0,
            })),
            hasSnapshot: qtyResult.rows.some((r: any) => r.content),
        });
    } catch (error: any) {
        console.error('Error fetching MD quantities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch MD quantities', message: error.message },
            { status: 500 }
        );
    }
}

// PUT: M/D 수량 + 추가 항목 저장 (스냅샷 포함)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { quantities, extraItems } = body;

        // 1. 기존 수량 삭제 후 재삽입 (스냅샷 포함)
        await query(`DELETE FROM we_project_md_quantities WHERE vrb_id = $1`, [id]);

        if (Array.isArray(quantities) && quantities.length > 0) {
            for (const q of quantities) {
                if (q.quantity === 0 && q.calculatedMd === 0) continue;
                await query(
                    `INSERT INTO we_project_md_quantities
                       (vrb_id, item_id, quantity, calculated_md,
                        classification, content, standard_md, category_code, category_name)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (vrb_id, item_id)
                     DO UPDATE SET quantity = EXCLUDED.quantity,
                                   calculated_md = EXCLUDED.calculated_md,
                                   classification = EXCLUDED.classification,
                                   content = EXCLUDED.content,
                                   standard_md = EXCLUDED.standard_md,
                                   category_code = EXCLUDED.category_code,
                                   category_name = EXCLUDED.category_name,
                                   updated_at = CURRENT_TIMESTAMP`,
                    [id, q.itemId, q.quantity || 0, q.calculatedMd || 0,
                        q.classification || '', q.content || '', q.standardMd || 0,
                        q.categoryCode || '', q.categoryName || '']
                );
            }
        }

        // 2. 추가 항목 삭제 후 재삽입 (VRB 전용)
        await query(`DELETE FROM we_project_md_extra_items WHERE vrb_id = $1`, [id]);

        if (Array.isArray(extraItems) && extraItems.length > 0) {
            for (let i = 0; i < extraItems.length; i++) {
                const item = extraItems[i];
                await query(
                    `INSERT INTO we_project_md_extra_items
                        (vrb_id, classification, content, standard_md, quantity, calculated_md, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [id, item.classification || '', item.content || '', item.standardMd || 0,
                        item.quantity || 0, item.calculatedMd || 0, i]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving MD quantities:', error);
        return NextResponse.json(
            { error: 'Failed to save MD quantities', message: error.message },
            { status: 500 }
        );
    }
}
