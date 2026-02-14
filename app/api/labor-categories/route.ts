import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 인력구분 목록 조회
export async function GET() {
  try {
    const sql = `
      SELECT id, code, name, description, display_order, is_active
      FROM we_labor_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `;

    const result = await query(sql);

    return NextResponse.json({ categories: result.rows });
  } catch (error: any) {
    console.error('Error fetching labor categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labor categories', message: error.message },
      { status: 500 }
    );
  }
}

// 인력구분 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, display_order } = body;

    const sql = `
      INSERT INTO we_labor_categories (code, name, description, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const result = await query(sql, [code, name, description || null, display_order || 0]);

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error creating labor category:', error);
    return NextResponse.json(
      { error: 'Failed to create labor category', message: error.message },
      { status: 500 }
    );
  }
}
