import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPermissionMenus } from '@/lib/menu-config';

// GET /api/permissions?roleCode=CD_001_04_01
// menus: 코드 기반 정적 목록 (DB 불필요), permissions: DB에서 역할별 권한 조회
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roleCode = searchParams.get('roleCode');

    // 메뉴 목록은 menu-config.ts에서 직접 읽음 (DB 조회 불필요)
    const menus = getPermissionMenus();

    if (!roleCode) {
        return NextResponse.json({ menus, permissions: [] });
    }

    try {
        const permSql = `
      SELECT menu_key, can_access, can_create, can_update, can_delete
      FROM we_role_permissions
      WHERE role_code = $1
    `;
        const permResult = await query(permSql, [roleCode]);

        return NextResponse.json({
            menus,
            permissions: permResult.rows,
        });
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch permissions', message: error.message },
            { status: 500 }
        );
    }
}
