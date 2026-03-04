import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccessibleMenuKeys } from '@/lib/utils/permissions';
import bcrypt from 'bcrypt';

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

        // 비밀번호 검증 (bcrypt 비교)
        const storedPassword = user.password_hash || user.username;
        let isMatch = false;

        if (storedPassword.startsWith('$2')) {
            // 이미 해시된 비밀번호인 경우
            isMatch = await bcrypt.compare(password, storedPassword);
        } else {
            // 마이그레이션 전 평문 비밀번호인 경우 (안전망)
            isMatch = password === storedPassword;
        }

        if (!isMatch) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 역할별 접근 가능 메뉴 목록 조회 (미들웨어 권한 체크용)
        const allowedMenuKeys = user.role_id
            ? Array.from(await getAccessibleMenuKeys(user.role_id))
            : [];

        // 로그인 후 이동할 첫 번째 허용 경로
        const MENU_KEY_TO_PATH: Record<string, string> = {
            'dashboard': '/dashboard',
            // 영업/PS
            'sales-group': '/sales',
            'sales/leads': '/sales/leads',
            'sales/opportunities': '/sales/opportunities',
            // 프로젝트
            'projects-group': '/projects',
            'projects': '/projects',
            'vrb-review': '/vrb-review',
            'contract-status': '/contract-status',
            'progress-management/monitoring': '/progress-management/monitoring',
            'profitability': '/profitability',
            'settlement': '/settlement',
            // 유지보수
            'maintenance-group': '/maintenance',
            'maintenance/free': '/maintenance/free',
            'maintenance/paid': '/maintenance/paid',
            // 업무실적
            'resources-group': '/resources',
            'resources/work-logs': '/resources/work-logs',
            // 설정
            'settings-group': '/settings',
            'settings/business-phases': '/settings/business-phases',
            'settings/clients': '/settings/clients',
            'settings/codes': '/settings/codes',
            'settings/departments': '/settings/departments',
            'settings/users': '/settings/users',
            'settings/permissions': '/settings/permissions',
            'settings/difficulty-checklist': '/settings/difficulty-checklist',
            'settings/md-estimation': '/settings/md-estimation',
            'settings/holidays': '/settings/holidays',
        };
        let firstPath = '/dashboard';
        for (const key of allowedMenuKeys) {
            const p = MENU_KEY_TO_PATH[key];
            if (p) { firstPath = p; break; }
        }

        // 로그인 성공 -> 쿠키 설정
        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                must_change_password: user.must_change_password
            },
            firstPath,
        });

        response.cookies.set('session', JSON.stringify({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role_id,
            rank: user.rank_name,
            position: user.title,
            departmentId: user.department_id,
            allowedMenuKeys, // 미들웨어 권한 체크용
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
