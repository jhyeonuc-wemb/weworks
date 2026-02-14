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

// 기준단가표 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const affiliationGroup = searchParams.get('affiliationGroup');
    const isActive = searchParams.get('isActive');

    let sql = `
      SELECT 
        id,
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
        display_order,
        created_at,
        updated_at
      FROM we_unit_prices
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (year) {
      sql += ` AND year = $${paramIndex}`;
      params.push(parseInt(year, 10));
      paramIndex++;
    }

    if (affiliationGroup) {
      sql += ` AND affiliation_group = $${paramIndex}`;
      params.push(affiliationGroup);
      paramIndex++;
    }

    if (isActive !== null) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY 
      CASE affiliation_group 
        WHEN '위엠비_컨설팅' THEN 1
        WHEN '위엠비_개발' THEN 2
        WHEN '외주_컨설팅' THEN 3
        WHEN '외주_개발' THEN 4
        ELSE 5
      END,
      year DESC, 
      job_group, 
      job_level, 
      grade, 
      display_order, 
      id`;

    const result = await query(sql, params);

    return NextResponse.json({
      unitPrices: result.rows.map((row: any) => ({
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
      })),
    });
  } catch (error: any) {
    console.error('Error fetching unit prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unit prices', message: error.message },
      { status: 500 }
    );
  }
}

// 기준단가표 생성
export async function POST(request: NextRequest) {
  try {
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
      isActive = true,
      displayOrder = 0,
    } = body;

    // 필수 필드 검증
    if (!affiliationGroup || !jobGroup || !jobLevel || !grade || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: affiliationGroup, jobGroup, jobLevel, grade, year' },
        { status: 400 }
      );
    }

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (affiliation_group, job_group, job_level, grade, year)
      DO UPDATE SET
        proposed_standard = EXCLUDED.proposed_standard,
        proposed_applied = EXCLUDED.proposed_applied,
        proposed_discount_rate = EXCLUDED.proposed_discount_rate,
        internal_applied = EXCLUDED.internal_applied,
        internal_increase_rate = EXCLUDED.internal_increase_rate,
        is_active = EXCLUDED.is_active,
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP
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
      isActive,
      displayOrder,
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating unit price:', error);

    // 중복 키 에러 처리
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate unit price. Same affiliation, job group, level, grade, and year already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create unit price', message: error.message },
      { status: 500 }
    );
  }
}
