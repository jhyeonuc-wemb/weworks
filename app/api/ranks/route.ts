import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 직급 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.sort_order AS display_order,
        c.description,
        c.is_active
      FROM we_codes c
      INNER JOIN we_codes p ON c.parent_id = p.id
      WHERE p.code = 'CD_001_01'
        AND c.is_active = true
      ORDER BY c.sort_order
    `;

    const result = await query(sql);

    return NextResponse.json({ ranks: result.rows });
  } catch (error: any) {
    console.error('Error fetching ranks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranks', message: error.message },
      { status: 500 }
    );
  }
}
