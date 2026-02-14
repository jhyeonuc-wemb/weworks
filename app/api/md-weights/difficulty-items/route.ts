import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 공통 난이도 항목 마스터 데이터 조회
export async function GET(request: NextRequest) {
    try {
        const result = await query(
            `SELECT id, category, content, description, default_difficulty, display_order 
       FROM we_md_difficulty_items 
       WHERE is_active = true 
       ORDER BY display_order, id`
        );

        return NextResponse.json({
            items: result.rows.map((row: any) => ({
                id: parseInt(row.id, 10),
                category: row.category,
                content: row.content,
                description: row.description || '',
                difficulty: parseInt(row.default_difficulty) || 0,
                weight: null,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching difficulty items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch difficulty items', message: error.message },
            { status: 500 }
        );
    }
}
