import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: vrb_review_id 기준 난이도 점수 + 의견 조회 (스냅샷 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const scoresResult = await query(
            `SELECT item_id, item_name, category_id, score,
                    category_label, category_weight, item_weight, item_guide
             FROM we_vrb_difficulty_scores
             WHERE vrb_review_id = $1`,
            [id]
        );

        const reviewResult = await query(
            `SELECT difficulty_comment, difficulty_total_score
             FROM we_project_vrb_reviews
             WHERE id = $1`,
            [id]
        );

        if (reviewResult.rows.length === 0) {
            return NextResponse.json({ error: 'VRB review not found' }, { status: 404 });
        }

        const review = reviewResult.rows[0];

        return NextResponse.json({
            scores: scoresResult.rows.map((r: any) => ({
                itemId: Number(r.item_id),
                itemName: r.item_name,
                categoryId: r.category_id,
                score: r.score,
                // 스냅샷 필드
                categoryLabel: r.category_label || '',
                categoryWeight: parseFloat(r.category_weight) || 0,
                itemWeight: parseFloat(r.item_weight) || 0,
                itemGuide: r.item_guide || '',
            })),
            comment: review.difficulty_comment || '',
            totalScore: review.difficulty_total_score ? parseFloat(review.difficulty_total_score) : null,
            // 스냅샷 여부 판단용 (category_label이 있으면 스냅샷)
            hasSnapshot: scoresResult.rows.some((r: any) => r.category_label),
        });
    } catch (error: any) {
        console.error('Error fetching VRB difficulty scores:', error);
        return NextResponse.json(
            { error: 'Failed to fetch difficulty scores', message: error.message },
            { status: 500 }
        );
    }
}

// PUT: 난이도 점수 저장 (스냅샷 포함)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { scores, comment, totalScore } = body;

        await query(`DELETE FROM we_vrb_difficulty_scores WHERE vrb_review_id = $1`, [id]);

        if (Array.isArray(scores) && scores.length > 0) {
            for (const s of scores) {
                if (s.score === null || s.score === undefined) continue;
                await query(
                    `INSERT INTO we_vrb_difficulty_scores
                       (vrb_review_id, item_id, item_name, category_id, score,
                        category_label, category_weight, item_weight, item_guide)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (vrb_review_id, item_id)
                     DO UPDATE SET score = EXCLUDED.score,
                                   item_name = EXCLUDED.item_name,
                                   category_label = EXCLUDED.category_label,
                                   category_weight = EXCLUDED.category_weight,
                                   item_weight = EXCLUDED.item_weight,
                                   item_guide = EXCLUDED.item_guide,
                                   updated_at = CURRENT_TIMESTAMP`,
                    [id, s.itemId, s.itemName || '', s.categoryId, s.score,
                        s.categoryLabel || '', s.categoryWeight || 0, s.itemWeight || 0, s.itemGuide || '']
                );
            }
        }

        await query(
            `UPDATE we_project_vrb_reviews
             SET difficulty_comment = $1,
                 difficulty_total_score = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [comment ?? null, totalScore ?? null, id]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving VRB difficulty scores:', error);
        return NextResponse.json(
            { error: 'Failed to save difficulty scores', message: error.message },
            { status: 500 }
        );
    }
}
