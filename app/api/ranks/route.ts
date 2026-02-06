import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 직급 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT 
        id,
        code,
        name,
        display_order,
        description,
        is_active
      FROM we_ranks
      WHERE is_active = true
      ORDER BY display_order
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
