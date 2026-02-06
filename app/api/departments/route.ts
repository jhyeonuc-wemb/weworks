import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 부서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT 
        id,
        name,
        parent_department_id,
        manager_id,
        description,
        display_order
      FROM we_departments
      ORDER BY display_order ASC, name ASC
    `;

    const result = await query(sql);

    return NextResponse.json({ departments: result.rows });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments', message: error.message },
      { status: 500 }
    );
  }
}

// 부서 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, parent_department_id, manager_id, description, display_order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const sql = `
      INSERT INTO we_departments (name, parent_department_id, manager_id, description, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(sql, [
      name,
      parent_department_id || null,
      manager_id || null,
      description || '',
      display_order || 0
    ]);

    return NextResponse.json({ department: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department', message: error.message },
      { status: 500 }
    );
  }
}
