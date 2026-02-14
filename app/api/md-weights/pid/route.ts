import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// P&ID 가중치 기준정보 조회
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT id, content, description, weight, display_order 
       FROM we_md_pid_weights 
       WHERE is_active = true 
       ORDER BY display_order, id`
    );

    return NextResponse.json({
      weights: result.rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        description: row.description || '',
        weight: parseFloat(row.weight) || 1.0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching pid weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pid weights', message: error.message },
      { status: 500 }
    );
  }
}
