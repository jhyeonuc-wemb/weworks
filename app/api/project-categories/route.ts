import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 프로젝트 카테고리 목록 조회
export async function GET() {
  try {
    const sql = `
      SELECT id, code, name, description, display_order
      FROM we_project_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `;

    const result = await query(sql);

    return NextResponse.json({ categories: result.rows });
  } catch (error: any) {
    console.error('Error fetching project categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project categories', message: error.message },
      { status: 500 }
    );
  }
}
