import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 전년도 기준단가표를 새 연도로 복사
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceYear, targetYear } = body;

    if (!sourceYear || !targetYear) {
      return NextResponse.json(
        { error: 'sourceYear and targetYear are required' },
        { status: 400 }
      );
    }

    if (sourceYear === targetYear) {
      return NextResponse.json(
        { error: 'Source year and target year cannot be the same' },
        { status: 400 }
      );
    }

    // 대상 연도에 기존 데이터가 있으면 삭제 (덮어쓰기)
    await query(
      `DELETE FROM we_unit_prices WHERE year = $1`,
      [targetYear]
    );

    // 전년도 데이터를 새 연도로 복사
    const sql = `
      INSERT INTO we_unit_prices (
        affiliation_group,
        job_group,
        job_level,
        grade,
        year,
        proposed_standard,
        proposed_applied,
        proposed_discount_rate,
        internal_applied,
        internal_increase_rate,
        is_active,
        display_order
      )
      SELECT
        affiliation_group,
        job_group,
        job_level,
        grade,
        $1 as year,
        proposed_standard,
        proposed_applied,
        proposed_discount_rate,
        internal_applied,
        internal_increase_rate,
        is_active,
        display_order
      FROM we_unit_prices
      WHERE year = $2
    `;

    const result = await query(sql, [targetYear, sourceYear]);

    // 복사된 데이터 조회
    const copiedData = await query(
      `SELECT COUNT(*) as count FROM we_unit_prices WHERE year = $1`,
      [targetYear]
    );

    return NextResponse.json({
      success: true,
      message: `Copied ${copiedData.rows[0].count} records from ${sourceYear} to ${targetYear}`,
      count: parseInt(copiedData.rows[0].count, 10),
    });
  } catch (error: any) {
    console.error('Error copying unit prices:', error);
    return NextResponse.json(
      { error: 'Failed to copy unit prices', message: error.message },
      { status: 500 }
    );
  }
}
