import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: vrb_review_id 기준 난이도 점수 + 의견 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 점수 목록
        const scoresResult = await query(
            `SELECT item_id, item_name, category_id, score
       FROM we_vrb_difficulty_scores
       WHERE vrb_review_id = $1`,
            [id]
        );

        // 의견 + 종합 점수
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
            })),
            comment: review.difficulty_comment || '',
            totalScore: review.difficulty_total_score ? parseFloat(review.difficulty_total_score) : null,
        });
    } catch (error: any) {
        console.error('Error fetching VRB difficulty scores:', error);
        return NextResponse.json(
            { error: 'Failed to fetch difficulty scores', message: error.message },
            { status: 500 }
        );
    }
}

// PUT: 난이도 점수 저장 (기존 삭제 후 재삽입) + 의견/종합점수 업데이트
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { scores, comment, totalScore } = body;

        // 기존 점수 삭제
        await query(
            `DELETE FROM we_vrb_difficulty_scores WHERE vrb_review_id = $1`,
            [id]
        );

        // 점수 재삽입
        if (Array.isArray(scores) && scores.length > 0) {
            for (const s of scores) {
                if (s.score === null || s.score === undefined) continue;
                await query(
                    `INSERT INTO we_vrb_difficulty_scores
             (vrb_review_id, item_id, item_name, category_id, score)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (vrb_review_id, item_id)
           DO UPDATE SET score = EXCLUDED.score,
                         item_name = EXCLUDED.item_name,
                         updated_at = CURRENT_TIMESTAMP`,
                    [id, s.itemId, s.itemName || '', s.categoryId, s.score]
                );
            }
        }

        // 의견 + 종합 점수 업데이트
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
