import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 역할 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT 
        id,
        name,
        description
      FROM we_roles
      ORDER BY name
    `;

    const result = await query(sql);

    return NextResponse.json({ roles: result.rows });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles', message: error.message },
      { status: 500 }
    );
  }
}
