import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: 마감 설정 조회
export async function GET(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    try {
        const res = await query(`SELECT * FROM we_work_log_deadline_config LIMIT 1`);
        const config = res.rows[0] || { deadline_day: 5, is_enabled: true };
        return NextResponse.json({ config });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT: 마감 설정 수정
export async function PUT(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    try {
        const { deadline_day, is_enabled } = await request.json();

        if (deadline_day < 1 || deadline_day > 28) {
            return NextResponse.json({ error: '마감일은 1~28 사이여야 합니다.' }, { status: 400 });
        }

        await query(
            `UPDATE we_work_log_deadline_config
             SET deadline_day = $1, is_enabled = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3`,
            [deadline_day, is_enabled, user.id]
        );
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
