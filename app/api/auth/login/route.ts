import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        const result = await query(
            `SELECT u.*, r.name as rank_name 
             FROM we_users u 
             LEFT JOIN we_codes r ON u.rank_id = r.id 
             WHERE u.username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 비밀번호 검증 (평문 비교 - 초기 비밀번호는 username과 동일)
        const storedPassword = user.password_hash || user.username;

        if (password !== storedPassword) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 로그인 성공 -> 쿠키 설정
        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                must_change_password: user.must_change_password
            }
        });

        response.cookies.set('session', JSON.stringify({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role_id, // 시스템 역할 (admin, pm, etc)
            rank: user.rank_name, // 직급 (사원, 대리, 과장, etc)
            position: user.title, // 직책 (팀장, 본부장, etc)
            departmentId: user.department_id
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1주일
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.', message: error.message }, { status: 500 });
    }
}
