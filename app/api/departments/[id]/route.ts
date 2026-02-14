import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Build dynamic query to only update provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (body.name !== undefined) {
            updates.push(`name = $${idx++}`);
            values.push(body.name);
        }
        if (body.parent_department_id !== undefined) {
            updates.push(`parent_department_id = $${idx++}`);
            values.push(body.parent_department_id === "" || body.parent_department_id === null ? null : body.parent_department_id);
        }
        if (body.manager_id !== undefined) {
            updates.push(`manager_id = $${idx++}`);
            values.push(body.manager_id === "" || body.manager_id === null ? null : body.manager_id);
        }
        if (body.description !== undefined) {
            updates.push(`description = $${idx++}`);
            values.push(body.description);
        }
        if (body.display_order !== undefined) {
            updates.push(`display_order = $${idx++}`);
            values.push(body.display_order);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const sql = `
      UPDATE we_departments
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
        values.push(id);

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ department: result.rows[0] });
    } catch (error: any) {
        console.error('Error updating department:', error);
        return NextResponse.json(
            { error: 'Failed to update department', message: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if there are child departments
        const checkSql = 'SELECT id FROM we_departments WHERE parent_department_id = $1';
        const checkResult = await query(checkSql, [id]);

        if (checkResult.rows.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete department with sub-departments' },
                { status: 400 }
            );
        }

        const sql = 'DELETE FROM we_departments WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        return NextResponse.json(
            { error: 'Failed to delete department', message: error.message },
            { status: 500 }
        );
    }
}
