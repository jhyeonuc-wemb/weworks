import { NextRequest, NextResponse } from 'next/server';
import { getAccessibleMenuKeys } from '@/lib/utils/permissions';

// GET /api/permissions/check?roleId=29&menuKey=projects
// middleware에서 호출 - 특정 역할이 특정 메뉴에 접근 가능한지 확인
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    const menuKey = searchParams.get('menuKey');

    if (!roleId || !menuKey) {
        return NextResponse.json({ canAccess: true }); // 파라미터 없으면 통과
    }

    try {
        const accessibleKeys = await getAccessibleMenuKeys(roleId);

        // 권한 데이터가 아예 없으면(설정 전) 통과 처리
        if (accessibleKeys.size === 0) {
            return NextResponse.json({ canAccess: true });
        }

        return NextResponse.json({ canAccess: accessibleKeys.has(menuKey) });
    } catch {
        return NextResponse.json({ canAccess: true }); // 오류 시 통과
    }
}
