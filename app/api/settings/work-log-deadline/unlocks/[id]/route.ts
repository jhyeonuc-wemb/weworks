import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// DELETE: 월별 해제 삭제 (마감 복구)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    try {
        const { id } = await params;
        await query(`DELETE FROM we_work_log_deadline_unlocks WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
