import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 휴일 정보 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const data = await request.json();
        const { holiday_date, name, is_recurring, description } = data;

        const sql = `
            UPDATE holidays
            SET holiday_date = $1,
                name = $2,
                is_recurring = $3,
                description = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;

        const result = await query(sql, [
            holiday_date,
            name,
            is_recurring,
            description,
            id
        ]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
        }

        return NextResponse.json({ holiday: result.rows[0] });
    } catch (error: any) {
        console.error('Error updating holiday:', error);
        return NextResponse.json(
            { error: 'Failed to update holiday', message: error.message },
            { status: 500 }
        );
    }
}

// 휴일 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);

        const sql = `DELETE FROM holidays WHERE id = $1`;
        const result = await query(sql, [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Holiday deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting holiday:', error);
        return NextResponse.json(
            { error: 'Failed to delete holiday', message: error.message },
            { status: 500 }
        );
    }
}
