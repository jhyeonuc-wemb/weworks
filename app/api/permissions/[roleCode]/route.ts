import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type RouteContext = { params: Promise<{ roleCode: string }> };

// GET /api/permissions/[roleCode] — 특정 역할 권한 조회
export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const { roleCode } = await params;

        const sql = `
      SELECT menu_key, can_access, can_create, can_update, can_delete
      FROM we_role_permissions
      WHERE role_code = $1
    `;
        const result = await query(sql, [roleCode]);

        return NextResponse.json({ permissions: result.rows });
    } catch (error: any) {
        console.error('Error fetching role permissions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch permissions', message: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/permissions/[roleCode] — 역할 권한 일괄 저장 (upsert)
export async function PUT(request: NextRequest, { params }: RouteContext) {
    try {
        const { roleCode } = await params;
        const body = await request.json();
        const { permissions } = body as {
            permissions: Array<{
                menu_key: string;
                can_access: boolean;
                can_create: boolean;
                can_update: boolean;
                can_delete: boolean;
            }>;
        };

        if (!permissions || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid permissions data' }, { status: 400 });
        }

        // 기존 권한 삭제 후 재삽입 (upsert)
        await query('DELETE FROM we_role_permissions WHERE role_code = $1', [roleCode]);

        if (permissions.length > 0) {
            const values = permissions
                .map((_, i) => `($1, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, $${i * 5 + 6})`)
                .join(', ');

            const flatParams: any[] = [roleCode];
            permissions.forEach((p) => {
                flatParams.push(p.menu_key, p.can_access, p.can_create, p.can_update, p.can_delete);
            });

            await query(
                `INSERT INTO we_role_permissions (role_code, menu_key, can_access, can_create, can_update, can_delete)
         VALUES ${values}
         ON CONFLICT (role_code, menu_key) DO UPDATE SET
           can_access = EXCLUDED.can_access,
           can_create = EXCLUDED.can_create,
           can_update = EXCLUDED.can_update,
           can_delete = EXCLUDED.can_delete,
           updated_at = CURRENT_TIMESTAMP`,
                flatParams
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving role permissions:', error);
        return NextResponse.json(
            { error: 'Failed to save permissions', message: error.message },
            { status: 500 }
        );
    }
}
