import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 특정 연도 이후의 인상율을 재계산하는 헬퍼 함수
async function recalculateIncreaseRates(
  affiliationGroup: string,
  jobGroup: string,
  jobLevel: string,
  grade: string,
  fromYear: number
) {
  try {
    // fromYear 이후의 모든 연도 데이터 조회
    const futureYears = await query(
      `SELECT id, year, internal_applied 
       FROM we_unit_prices 
       WHERE affiliation_group = $1 
         AND job_group = $2 
         AND job_level = $3 
         AND grade = $4 
         AND year > $5
       ORDER BY year ASC`,
      [affiliationGroup, jobGroup, jobLevel, grade, fromYear]
    );

    // 각 연도의 인상율 재계산
    for (const row of futureYears.rows) {
      const currentYear = parseInt(row.year, 10);
      const currentInternalApplied = row.internal_applied ? parseFloat(row.internal_applied) : null;

      if (currentInternalApplied !== null) {
        // 전년도 데이터 조회
        const previousYear = currentYear - 1;
        const prevYearData = await query(
          `SELECT internal_applied 
           FROM we_unit_prices 
           WHERE affiliation_group = $1 
             AND job_group = $2 
             AND job_level = $3 
             AND grade = $4 
             AND year = $5`,
          [affiliationGroup, jobGroup, jobLevel, grade, previousYear]
        );

        let newIncreaseRate = null;
        if (prevYearData.rows.length > 0 && prevYearData.rows[0].internal_applied) {
          const prevInternalApplied = parseFloat(prevYearData.rows[0].internal_applied);
          newIncreaseRate = ((currentInternalApplied - prevInternalApplied) / prevInternalApplied) * 100;
        }

        // 인상율 업데이트
        await query(
          `UPDATE we_unit_prices 
           SET internal_increase_rate = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [newIncreaseRate, row.id]
        );
      }
    }
  } catch (error) {
    console.error('Error recalculating increase rates:', error);
    // 에러가 발생해도 메인 작업은 계속 진행
  }
}

// 기준단가표 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT * FROM we_unit_prices WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unit price not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    return NextResponse.json({
      unitPrice: {
        id: parseInt(row.id, 10),
        affiliationGroup: row.affiliation_group,
        jobGroup: row.job_group,
        jobLevel: row.job_level,
        grade: row.grade,
        year: parseInt(row.year, 10),
        proposedStandard: row.proposed_standard != null ? parseFloat(row.proposed_standard) : null,
        proposedApplied: row.proposed_applied != null ? parseFloat(row.proposed_applied) : null,
        proposedDiscountRate: row.proposed_discount_rate != null ? parseFloat(row.proposed_discount_rate) : null,
        internalApplied: row.internal_applied != null ? parseFloat(row.internal_applied) : null,
        internalIncreaseRate: row.internal_increase_rate != null ? parseFloat(row.internal_increase_rate) : null,
        isActive: row.is_active,
        displayOrder: parseInt(row.display_order, 10),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching unit price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unit price', message: error.message },
      { status: 500 }
    );
  }
}

// 기준단가표 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      affiliationGroup,
      jobGroup,
      jobLevel,
      grade,
      year,
      proposedStandard,
      proposedApplied,
      proposedDiscountRate,
      internalApplied,
      internalIncreaseRate,
      isActive,
      displayOrder,
    } = body;

    // 기존 데이터 확인
    const existingResult = await query(
      `SELECT * FROM we_unit_prices WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unit price not found' },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE we_unit_prices
      SET
        affiliation_group = $1,
        job_group = $2,
        job_level = $3,
        grade = $4,
        year = $5,
        proposed_standard = $6,
        proposed_applied = $7,
        proposed_discount_rate = $8,
        internal_applied = $9,
        internal_increase_rate = $10,
        is_active = $11,
        display_order = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const result = await query(sql, [
      affiliationGroup,
      jobGroup,
      jobLevel,
      grade,
      parseInt(year, 10),
      proposedStandard !== null && proposedStandard !== undefined ? proposedStandard : null,
      proposedApplied !== null && proposedApplied !== undefined ? proposedApplied : null,
      proposedDiscountRate !== null && proposedDiscountRate !== undefined ? proposedDiscountRate : null,
      internalApplied !== null && internalApplied !== undefined ? internalApplied : null,
      internalIncreaseRate !== null && internalIncreaseRate !== undefined ? internalIncreaseRate : null,
      isActive !== undefined ? isActive : true,
      displayOrder !== undefined ? displayOrder : 0,
      id,
    ]);

    const row = result.rows[0];

    // 이후 연도들의 인상율 재계산
    await recalculateIncreaseRates(
      affiliationGroup,
      jobGroup,
      jobLevel,
      grade,
      parseInt(year, 10)
    );

    return NextResponse.json({
      unitPrice: {
        id: parseInt(row.id, 10),
        affiliationGroup: row.affiliation_group,
        jobGroup: row.job_group,
        jobLevel: row.job_level,
        grade: row.grade,
        year: parseInt(row.year, 10),
        proposedStandard: row.proposed_standard != null ? parseFloat(row.proposed_standard) : null,
        proposedApplied: row.proposed_applied != null ? parseFloat(row.proposed_applied) : null,
        proposedDiscountRate: row.proposed_discount_rate != null ? parseFloat(row.proposed_discount_rate) : null,
        internalApplied: row.internal_applied != null ? parseFloat(row.internal_applied) : null,
        internalIncreaseRate: row.internal_increase_rate != null ? parseFloat(row.internal_increase_rate) : null,
        isActive: row.is_active,
        displayOrder: parseInt(row.display_order, 10),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating unit price:', error);

    // 중복 키 에러 처리
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate unit price. Same affiliation, job group, level, grade, and year already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update unit price', message: error.message },
      { status: 500 }
    );
  }
}

// 기준단가표 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 삭제 전에 데이터 정보 저장 (이후 연도 재계산용)
    const existingResult = await query(
      `SELECT affiliation_group, job_group, job_level, grade, year 
       FROM we_unit_prices WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unit price not found' },
        { status: 404 }
      );
    }

    const deletedRecord = existingResult.rows[0];

    const result = await query(
      `DELETE FROM we_unit_prices WHERE id = $1 RETURNING id`,
      [id]
    );

    // 삭제 후 이후 연도들의 인상율 재계산
    await recalculateIncreaseRates(
      deletedRecord.affiliation_group,
      deletedRecord.job_group,
      deletedRecord.job_level,
      deletedRecord.grade,
      parseInt(deletedRecord.year, 10)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting unit price:', error);
    return NextResponse.json(
      { error: 'Failed to delete unit price', message: error.message },
      { status: 500 }
    );
  }
}
