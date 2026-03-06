import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: 월별 해제 목록
export async function GET(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    try {
        const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();
        const res = await query(
            `SELECT u.*, us.name as created_by_name
             FROM we_work_log_deadline_unlocks u
             LEFT JOIN we_users us ON us.id = u.created_by
             WHERE u.target_year = $1
             ORDER BY u.target_month ASC`,
            [year]
        );
        return NextResponse.json({ unlocks: res.rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: 월별 마감 해제 추가
export async function POST(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    try {
        const { target_year, target_month, reason } = await request.json();

        if (!target_year || !target_month) {
            return NextResponse.json({ error: '연도와 월은 필수입니다.' }, { status: 400 });
        }

        const res = await query(
            `INSERT INTO we_work_log_deadline_unlocks (target_year, target_month, reason, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (target_year, target_month) DO UPDATE
             SET reason = EXCLUDED.reason, created_by = EXCLUDED.created_by
             RETURNING *`,
            [target_year, target_month, reason || null, user.id]
        );
        return NextResponse.json({ success: true, unlock: res.rows[0] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
