import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 인력구분 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['code', 'name', 'description', 'display_order', 'is_active'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `
      UPDATE we_labor_categories 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    return NextResponse.json({ category: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating labor category:', error);
    return NextResponse.json(
      { error: 'Failed to update labor category', message: error.message },
      { status: 500 }
    );
  }
}

// 인력구분 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 실제 삭제 대신 비활성화
    await query(
      `UPDATE we_labor_categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting labor category:', error);
    return NextResponse.json(
      { error: 'Failed to delete labor category', message: error.message },
      { status: 500 }
    );
  }
}
