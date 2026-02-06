import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 3D 모델링 가중치 기준정보 조회
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT id, content, description, weight, display_order 
       FROM we_md_modeling_3d_weights 
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
    console.error('Error fetching modeling 3d weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modeling 3d weights', message: error.message },
      { status: 500 }
    );
  }
}
