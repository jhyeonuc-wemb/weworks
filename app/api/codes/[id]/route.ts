import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 특정 코드 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sql = `SELECT * FROM we_codes WHERE id = $1`;
        const result = await query(sql, [parseInt(id)]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Code not found' }, { status: 404 });
        }

        return NextResponse.json({ code: result.rows[0] });
    } catch (error: any) {
        console.error('Error fetching code:', error);
        return NextResponse.json(
            { error: 'Failed to fetch code', message: error.message },
            { status: 500 }
        );
    }
}

// 코드 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const { parent_id, code, name, description, display_order, is_active } = data;

        // 시스템 코드 여부 확인 (일부 필드 보호 가능)
        const checkSystemSql = `SELECT is_system FROM we_codes WHERE id = $1`;
        const checkSystemResult = await query(checkSystemSql, [parseInt(id)]);
        const isSystem = checkSystemResult.rows[0]?.is_system;

        const sql = `
      UPDATE we_codes 
      SET 
        parent_id = $1,
        code = $2,
        name = $3,
        description = $4,
        display_order = $5,
        is_active = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

        const result = await query(sql, [
            parent_id || null,
            code,
            name,
            description || '',
            display_order || 0,
            is_active !== undefined ? is_active : true,
            parseInt(id)
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Code not found' }, { status: 404 });
        }

        return NextResponse.json({ code: result.rows[0] });
    } catch (error: any) {
        console.error('Error updating code:', error);
        return NextResponse.json(
            { error: 'Failed to update code', message: error.message },
            { status: 500 }
        );
    }
}

// 코드 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 시스템 코드 여부 확인
        const checkSystemSql = `SELECT is_system FROM we_codes WHERE id = $1`;
        const checkSystemResult = await query(checkSystemSql, [parseInt(id)]);

        if (checkSystemResult.rows[0]?.is_system) {
            return NextResponse.json({ error: 'System codes cannot be deleted' }, { status: 403 });
        }

        const sql = `DELETE FROM we_codes WHERE id = $1`;
        await query(sql, [parseInt(id)]);

        return NextResponse.json({ message: 'Code deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting code:', error);
        return NextResponse.json(
            { error: 'Failed to delete code', message: error.message },
            { status: 500 }
        );
    }
}
