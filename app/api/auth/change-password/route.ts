import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json();
        const session = request.cookies.get('session');

        if (!session) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const sessionData = JSON.parse(session.value);
        const userId = sessionData.id;

        if (!newPassword) {
            return NextResponse.json({ error: '새 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        // 사용자 정보 조회
        const user = await query(
            'SELECT password_hash, must_change_password FROM we_users WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        const { password_hash: storedPassword, must_change_password: mustChange } = user.rows[0];

        if (currentPassword) {
            // 개인설정에서 비밀번호 변경: 현재 비밀번호 확인
            if (currentPassword !== storedPassword) {
                return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 });
            }
        } else {
            // 최초 로그인 비밀번호 변경: must_change_password 플래그 확인
            if (!mustChange) {
                return NextResponse.json({ error: '현재 비밀번호를 입력해주세요.' }, { status: 400 });
            }
        }

        // 비밀번호 변경 및 must_change_password 해제
        await query(
            'UPDATE we_users SET password_hash = $1, must_change_password = false WHERE id = $2',
            [newPassword, userId]
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
