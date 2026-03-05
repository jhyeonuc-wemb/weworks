import { NextRequest, NextResponse } from 'next/server';
import { getAccessibleMenuKeys } from '@/lib/utils/permissions';

/**
 * POST /api/auth/refresh-session
 * 권한 변경 후 세션 쿠키의 allowedMenuKeys를 최신 DB 값으로 갱신합니다.
 */
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('session');
        if (!session) {
            return NextResponse.json({ error: '세션이 없습니다.' }, { status: 401 });
        }

        let sessionData: Record<string, any>;
        try {
            sessionData = JSON.parse(session.value);
        } catch {
            return NextResponse.json({ error: '세션 파싱 실패' }, { status: 400 });
        }

        if (!sessionData?.id) {
            return NextResponse.json({ error: '유효하지 않은 세션' }, { status: 401 });
        }

        // DB에서 최신 권한 목록 조회
        const allowedMenuKeys = sessionData.role
            ? Array.from(await getAccessibleMenuKeys(sessionData.role))
            : [];

        // 세션 쿠키 갱신 (allowedMenuKeys만 업데이트)
        const updatedSession = { ...sessionData, allowedMenuKeys };

        const response = NextResponse.json({ success: true, allowedMenuKeys });
        response.cookies.set('session', JSON.stringify(updatedSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Session refresh error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
