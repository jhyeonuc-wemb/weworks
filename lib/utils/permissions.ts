import pool from '@/lib/db';

/**
 * role_id(we_codes.id의 숫자값)로 해당 역할의 접근 가능한 menu_key Set을 반환.
 * Middleware(Edge 아닌 Node.js 환경)와 API route 양쪽에서 사용.
 */
export async function getAccessibleMenuKeys(roleId: number | string | null | undefined): Promise<Set<string>> {
    if (!roleId) return new Set();

    try {
        // role_id → role_code 변환 후 permissions 조회
        const result = await pool.query(
            `SELECT rp.menu_key
             FROM we_role_permissions rp
             JOIN we_codes c ON c.code = rp.role_code
             WHERE c.id = $1 AND rp.can_access = true`,
            [roleId]
        );
        return new Set(result.rows.map((r: { menu_key: string }) => r.menu_key));
    } catch (error) {
        console.error('Failed to get accessible menu keys:', error);
        return new Set();
    }
}

/**
 * role_id로 해당 역할의 전체 권한 맵을 반환.
 * { menu_key: { can_access, can_create, can_update, can_delete } }
 */
export async function getRolePermissions(roleId: number | string | null | undefined): Promise<Record<string, {
    can_access: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
}>> {
    if (!roleId) return {};

    try {
        const result = await pool.query(
            `SELECT rp.menu_key, rp.can_access, rp.can_create, rp.can_update, rp.can_delete
             FROM we_role_permissions rp
             JOIN we_codes c ON c.code = rp.role_code
             WHERE c.id = $1`,
            [roleId]
        );
        const map: Record<string, { can_access: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }> = {};
        for (const row of result.rows) {
            map[row.menu_key] = {
                can_access: row.can_access,
                can_create: row.can_create,
                can_update: row.can_update,
                can_delete: row.can_delete,
            };
        }
        return map;
    } catch (error) {
        console.error('Failed to get role permissions:', error);
        return {};
    }
}
