import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('session');

        if (!session) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const sessionData = JSON.parse(session.value);
        const userId = sessionData.id;

        // 상세 사용자 정보 조회
        const userSql = `
            SELECT 
                u.*,
                rk.name as rank_name,
                d.name as department_name
            FROM we_users u
            LEFT JOIN we_codes rk ON u.rank_id = rk.id
            LEFT JOIN we_departments d ON u.department_id = d.id
            WHERE u.id = $1
        `;

        const userResult = await query(userSql, [userId]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        const user = userResult.rows[0];

        // 부서 정보 조회 (전체 경로 포함)
        if (user.department_id) {
            const deptSql = `
                WITH RECURSIVE DeptHierarchy AS (
                    SELECT id, name, parent_department_id, 1 as level
                    FROM we_departments
                    WHERE id = $1
                    UNION ALL
                    SELECT d.id, d.name, d.parent_department_id, dh.level + 1
                    FROM we_departments d
                    JOIN DeptHierarchy dh ON d.id = dh.parent_department_id
                    WHERE d.id IS NOT NULL
                )
                SELECT string_agg(name, ' > ' ORDER BY level DESC) as full_name FROM DeptHierarchy;
            `;

            try {
                const deptResult = await query(deptSql, [user.department_id]);
                if (deptResult.rows.length > 0) {
                    let fullName = deptResult.rows[0].full_name;
                    // (주)위엠비 접두사 제거
                    fullName = fullName.replace(/^\(주\)\s*위엠비\s*>\s*/, '').replace(/^\(주\)\s*위엠비/, '');
                    user.department_name = fullName;
                }
            } catch (err) {
                console.error('Failed to fetch department info:', err);
            }
        }

        // 비밀번호 해시는 제외
        delete user.password_hash;

        // 하위 호환성을 위한 필드 매핑
        user.rank = user.rank_name;
        user.position = user.title;
        user.department = user.department_name;

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error getting user info:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = request.cookies.get('session');
        if (!session) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const sessionData = JSON.parse(session.value);
        const userId = sessionData.id;
        const body = await request.json();

        // 업데이트 가능한 필드들 (역할, 퇴사일 등 민감 정보 제외)
        const {
            name,
            email,
            phone,
            employee_number,
            address,
            address_detail,
            postcode,
            title,
            grade,
            user_state,
            contract_type,
            joined_date
        } = body;

        const updateSql = `
            UPDATE we_users
            SET 
                name = $1,
                email = $2,
                phone = $3,
                employee_number = $4,
                address = $5,
                address_detail = $6,
                postcode = $7,
                title = $8,
                grade = $9,
                user_state = $10,
                contract_type = $11,
                joined_date = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING *
        `;

        const result = await query(updateSql, [
            name,
            email,
            phone || null,
            employee_number || null,
            address || null,
            address_detail || null,
            postcode || null,
            title || null,
            grade || null,
            user_state || null,
            contract_type || null,
            joined_date || null,
            userId
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        const updatedUser = result.rows[0];
        delete updatedUser.password_hash;

        // 하위 호환성을 위한 필드 매핑
        updatedUser.rank = updatedUser.rank_name; // Note: rank_name might be missing in basic RETURNING *, but let's be safe
        updatedUser.position = updatedUser.title;
        updatedUser.department = updatedUser.department_name;

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: '프로필 수정 중 오류가 발생했습니다.', message: error.message }, { status: 500 });
    }
}
