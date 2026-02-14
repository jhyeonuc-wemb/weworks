import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// VRB Review 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // 헤더 정보
    const headerResult = await query(
      `SELECT * FROM we_project_vrb_reviews WHERE id = $1`,
      [id]
    );

    if (headerResult.rows.length === 0) {
      return NextResponse.json({ error: 'VRB review not found' }, { status: 404 });
    }

    const review = headerResult.rows[0];

    // 프로젝트 ID 검증 (요청에 projectId가 있으면 검증)
    if (projectId && review.project_id !== parseInt(projectId)) {
      return NextResponse.json(
        { error: 'Project ID mismatch. Cannot access VRB review from different project.' },
        { status: 403 }
      );
    }

    // 주요내용
    const contentsResult = await query(
      `SELECT * FROM we_project_vrb_key_contents WHERE vrb_review_id = $1 ORDER BY display_order, id`,
      [id]
    );

    // 주요활동
    const activitiesResult = await query(
      `SELECT * FROM we_project_vrb_key_activities WHERE vrb_review_id = $1 ORDER BY display_order, id`,
      [id]
    );

    // 프로젝트 수행 비용 (Worst)
    const worstCostsResult = await query(
      `SELECT * FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
      [id]
    );

    // 프로젝트 수행 비용 (Best)
    const bestCostsResult = await query(
      `SELECT * FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
      [id]
    );

    // 예상 M/M 항목 (Worst)
    const worstMmItemsResult = await query(
      `SELECT * FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
      [id]
    );

    // 예상 M/M 항목 (Best)
    const bestMmItemsResult = await query(
      `SELECT * FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
      [id]
    );

    // 타사 상품 매입 항목 (Worst)
    const worstOtherGoodsResult = await query(
      `SELECT * FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
      [id]
    );

    // 타사 상품 매입 항목 (Best)
    const bestOtherGoodsResult = await query(
      `SELECT * FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
      [id]
    );

    // 날짜를 YYYY-MM-DD 형식으로 정규화하여 반환
    const normalizeDate = (dateValue: any): string | null => {
      if (!dateValue || dateValue === null || dateValue === undefined) {
        return null;
      }

      const dateStr = String(dateValue).trim();

      // 빈 문자열 체크
      if (dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
        return null;
      }

      // 이미 YYYY-MM-DD 형식인 경우
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }

      // ISO 형식인 경우 YYYY-MM-DD만 추출
      if (dateStr.includes('T')) {
        const datePart = dateStr.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return datePart;
        }
      }

      // Date 객체로 파싱 시도
      try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Date 파싱 실패 시 무시
      }

      // 다른 형식인 경우 첫 10자리만 사용
      if (dateStr.length >= 10) {
        const first10 = dateStr.substring(0, 10);
        if (first10.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return first10;
        }
      }

      // 변환 실패 시 null 반환
      console.warn('[API GET] 날짜 형식 변환 실패:', dateStr);
      return null;
    };

    // 날짜 정규화 및 디버깅
    const normalizedContents = contentsResult.rows.map((row: any) => {
      const normalized = normalizeDate(row.content_date);
      console.log('[API GET] 주요내용 날짜 정규화:', {
        원본: row.content_date,
        정규화: normalized,
        타입: typeof row.content_date,
      });
      return {
        ...row,
        content_date: normalized,
      };
    });

    const normalizedActivities = activitiesResult.rows.map((row: any) => {
      const normalized = normalizeDate(row.activity_date);
      console.log('[API GET] 주요활동 날짜 정규화:', {
        원본: row.activity_date,
        정규화: normalized,
        타입: typeof row.activity_date,
      });
      return {
        ...row,
        activity_date: normalized,
      };
    });

    return NextResponse.json({
      review: {
        ...review,
        keyContents: normalizedContents,
        keyActivities: normalizedActivities,
        worstCase: {
          projectCosts: worstCostsResult.rows,
          estimatedMmItems: worstMmItemsResult.rows,
          otherGoodsItems: worstOtherGoodsResult.rows,
        },
        bestCase: {
          projectCosts: bestCostsResult.rows,
          estimatedMmItems: bestMmItemsResult.rows,
          otherGoodsItems: bestOtherGoodsResult.rows,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching VRB review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VRB review', message: error.message },
      { status: 500 }
    );
  }
}

// VRB Review 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[API PUT] VRB Review 업데이트 요청:', {
      id,
      bodyKeys: Object.keys(body),
      worst_include_external_purchase: body.worst_include_external_purchase,
      best_include_external_purchase: body.best_include_external_purchase,
      worst_external_purchase_percent: body.worst_external_purchase_percent,
      best_external_purchase_percent: body.best_external_purchase_percent,
    });

    // 프로젝트 ID 검증 (요청에 project_id가 있으면 검증)
    if (body.project_id !== undefined) {
      const existingReview = await query(
        `SELECT project_id FROM we_project_vrb_reviews WHERE id = $1`,
        [id]
      );

      if (existingReview.rows.length === 0) {
        return NextResponse.json({ error: 'VRB review not found' }, { status: 404 });
      }

      // 타입 변환하여 비교 (BIGINT와 숫자 타입 불일치 방지)
      const existingProjectId = parseInt(String(existingReview.rows[0].project_id), 10);
      const requestProjectId = parseInt(String(body.project_id), 10);

      console.log('[API PUT] Project ID 검증:', {
        existingProjectId,
        requestProjectId,
        existingType: typeof existingReview.rows[0].project_id,
        requestType: typeof body.project_id,
      });

      if (existingProjectId !== requestProjectId) {
        return NextResponse.json(
          { error: 'Project ID mismatch. Cannot update VRB review from different project.' },
          { status: 403 }
        );
      }
    }

    // 헤더 업데이트
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    const headerFields = [
      'customer_name',
      'project_budget',
      'win_probability',
      'win_date',
      'business_type',
      'partners',
      'partner_info',
      'competitors',
      'customer_info',
      'sales_manager',
      'ps_manager',
      'expected_start_date',
      'expected_end_date',
      'main_contractor',
      'key_solutions',
      'business_background',
      'business_scope',
      'risk',
      'business_basis',
      'worst_estimated_revenue_goods',
      'worst_estimated_revenue_services',
      'worst_estimated_revenue_hw',
      'worst_estimated_mm',
      'worst_other_goods_purchase',
      'worst_existing_system_linkage',
      'worst_risk_cost_percent',
      'worst_risk_cost_base',
      'worst_external_purchase_percent',
      'worst_external_purchase_base',
      'worst_external_purchase2_percent',
      'worst_external_purchase2_base',
      'worst_include_external_purchase',
      'worst_include_external_purchase2',
      'worst_operating_profit',
      'worst_operating_profit_percent',
      'worst_operating_profit2',
      'worst_operating_profit2_percent',
      'best_estimated_revenue_goods',
      'best_estimated_revenue_services',
      'best_estimated_revenue_hw',
      'best_estimated_mm',
      'best_other_goods_purchase',
      'best_existing_system_linkage',
      'best_risk_cost_percent',
      'best_risk_cost_base',
      'best_external_purchase_percent',
      'best_external_purchase_base',
      'best_external_purchase2_percent',
      'best_external_purchase2_base',
      'best_include_external_purchase',
      'best_include_external_purchase2',
      'best_operating_profit',
      'best_operating_profit_percent',
      'best_operating_profit2',
      'best_operating_profit2_percent',
      'md_estimation_id',
      'status',
      'rejection_reason',
      'ui_settings',
    ];

    headerFields.forEach((field) => {
      if (body[field] !== undefined) {
        let value = body[field];

        // 날짜 필드는 YYYY-MM 형식을 YYYY-MM-DD로 변환
        if ((field === 'expected_start_date' || field === 'expected_end_date') && value) {
          // 이미 YYYY-MM-DD 형식이면 그대로 사용, YYYY-MM 형식이면 -01 추가
          if (typeof value === 'string' && value.length === 7 && value.match(/^\d{4}-\d{2}$/)) {
            value = `${value}-01`;
          }
        }

        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length > 0) {
      updateValues.push(id);
      const updateSql = `UPDATE we_project_vrb_reviews SET ${updateFields.join(', ')}, status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
      console.log('[API PUT] 업데이트 SQL:', updateSql);
      console.log('[API PUT] 업데이트 값:', updateValues);

      await query(updateSql, updateValues);
      console.log('[API PUT] 업데이트 성공');

      // VRB 상태가 COMPLETED로 변경되면 프로젝트 상태도 업데이트
      if (body.status === 'COMPLETED') {
        try {
          // 프로젝트 ID 가져오기 (VRB에서 직접 조회)
          const vrbResult = await query(
            `SELECT project_id FROM we_project_vrb_reviews WHERE id = $1`,
            [id]
          );

          if (vrbResult.rows.length === 0) {
            console.error('[API PUT] VRB review not found for project status update');
            throw new Error('VRB review not found');
          }

          const projectId = parseInt(String(vrbResult.rows[0].project_id), 10);
          const projectStatus = 'vrb_completed';

          console.log(`[API PUT] VRB Review COMPLETED. Updating project ${projectId} phase to profitability`);
          const updateResult = await query(
            `UPDATE we_projects 
             SET status = $1, current_phase = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [projectStatus, 'profitability', projectId]
          );

          console.log('[API PUT] 프로젝트 상태 업데이트 성공:', {
            projectId,
            projectStatus,
            rowsAffected: updateResult.rowCount
          });
        } catch (error: any) {
          console.error('[API PUT] 프로젝트 상태 업데이트 실패:', {
            error: error.message,
            stack: error.stack,
            vrbId: id,
            status: body.status
          });
          // 프로젝트 상태 업데이트 실패해도 VRB 업데이트는 성공했으므로 에러를 throw하지 않음
          // 대신 로그만 남김
        }
      }
    } else {
      console.log('[API PUT] 업데이트할 필드가 없음');
    }

    // 날짜를 YYYY-MM-DD 형식으로 정규화하는 헬퍼 함수
    const normalizeDateToYYYYMMDD = (dateValue: any): string | null => {
      // null, undefined, 빈 문자열 체크
      if (!dateValue || dateValue === null || dateValue === undefined) {
        return null;
      }

      const dateStr = String(dateValue).trim();

      // 빈 문자열 체크
      if (dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
        return null;
      }

      // 이미 YYYY-MM-DD 형식인 경우
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }

      // ISO 형식인 경우 (YYYY-MM-DDTHH:mm:ss 또는 YYYY-MM-DDTHH:mm:ss.sssZ)
      if (dateStr.includes('T')) {
        const datePart = dateStr.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return datePart;
        }
      }

      // JavaScript Date 객체의 toString() 형식 (예: "Fri Nov 10 2023")을 처리
      try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Date 파싱 실패 시 무시
        console.warn('[API PUT] Date 파싱 실패:', dateStr, e);
      }

      // 다른 형식인 경우 첫 10자리만 사용 (YYYY-MM-DD 형식일 가능성)
      if (dateStr.length >= 10) {
        const first10 = dateStr.substring(0, 10);
        if (first10.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return first10;
        }
      }

      // 모든 변환 실패 시 null 반환
      console.warn('[API PUT] 날짜 형식 변환 실패:', dateStr);
      return null;
    };

    // 주요내용 업데이트 (기존 삭제 후 재삽입)
    if (body.keyContents !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_key_contents WHERE vrb_review_id = $1`,
        [id]
      );
      if (body.keyContents.length > 0) {
        for (let i = 0; i < body.keyContents.length; i++) {
          const content = body.keyContents[i];
          const normalizedDate = normalizeDateToYYYYMMDD(content.content_date);
          await query(
            `INSERT INTO we_project_vrb_key_contents (vrb_review_id, content_date, content, display_order, ui_height) VALUES ($1, $2, $3, $4, $5)`,
            [id, normalizedDate, content.content || '', i, content.ui_height || null]
          );
        }
      }
    }

    // 주요활동 업데이트 (기존 삭제 후 재삽입)
    if (body.keyActivities !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_key_activities WHERE vrb_review_id = $1`,
        [id]
      );
      if (body.keyActivities.length > 0) {
        for (let i = 0; i < body.keyActivities.length; i++) {
          const activity = body.keyActivities[i];
          const normalizedDate = normalizeDateToYYYYMMDD(activity.activity_date);
          await query(
            `INSERT INTO we_project_vrb_key_activities (vrb_review_id, activity_date, activity, attendees, display_order, ui_height) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, normalizedDate, activity.activity || '', activity.attendees || null, i, activity.ui_height || null]
          );
        }
      }
    }

    // 프로젝트 수행 비용 업데이트 (기존 삭제 후 재삽입)
    if (body.worstCase?.projectCosts !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'worst'`,
        [id]
      );
      if (body.worstCase.projectCosts.length > 0) {
        for (let i = 0; i < body.worstCase.projectCosts.length; i++) {
          const cost = body.worstCase.projectCosts[i];
          await query(
            `INSERT INTO we_project_vrb_project_costs (vrb_review_id, case_type, item, amount, display_order) VALUES ($1, 'worst', $2, $3, $4)`,
            [id, cost.item || '', cost.amount || 0, i]
          );
        }
      }
    }

    if (body.bestCase?.projectCosts !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'best'`,
        [id]
      );
      if (body.bestCase.projectCosts.length > 0) {
        for (let i = 0; i < body.bestCase.projectCosts.length; i++) {
          const cost = body.bestCase.projectCosts[i];
          await query(
            `INSERT INTO we_project_vrb_project_costs (vrb_review_id, case_type, item, amount, display_order) VALUES ($1, 'best', $2, $3, $4)`,
            [id, cost.item || '', cost.amount || 0, i]
          );
        }
      }
    }

    // 예상 M/M 항목 업데이트 (기존 삭제 후 재삽입)
    if (body.worstCase?.estimatedMmItems !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'worst'`,
        [id]
      );
      if (body.worstCase.estimatedMmItems.length > 0) {
        for (let i = 0; i < body.worstCase.estimatedMmItems.length; i++) {
          const item = body.worstCase.estimatedMmItems[i];
          await query(
            `INSERT INTO we_project_vrb_estimated_mm_items (vrb_review_id, case_type, item, mm, display_order) VALUES ($1, 'worst', $2, $3, $4)`,
            [id, item.item || '', item.mm || 0, i]
          );
        }
      }
    }

    if (body.bestCase?.estimatedMmItems !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'best'`,
        [id]
      );
      if (body.bestCase.estimatedMmItems.length > 0) {
        for (let i = 0; i < body.bestCase.estimatedMmItems.length; i++) {
          const item = body.bestCase.estimatedMmItems[i];
          await query(
            `INSERT INTO we_project_vrb_estimated_mm_items (vrb_review_id, case_type, item, mm, display_order) VALUES ($1, 'best', $2, $3, $4)`,
            [id, item.item || '', item.mm || 0, i]
          );
        }
      }
    }

    // 타사 상품 매입 항목 업데이트 (기존 삭제 후 재삽입)
    if (body.worstCase?.otherGoodsItems !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'worst'`,
        [id]
      );
      if (body.worstCase.otherGoodsItems.length > 0) {
        for (let i = 0; i < body.worstCase.otherGoodsItems.length; i++) {
          const item = body.worstCase.otherGoodsItems[i];
          await query(
            `INSERT INTO we_project_vrb_other_goods (vrb_review_id, case_type, item, amount, display_order) VALUES ($1, 'worst', $2, $3, $4)`,
            [id, item.item || '', item.amount || 0, i]
          );
        }
      }
    }

    if (body.bestCase?.otherGoodsItems !== undefined) {
      await query(
        `DELETE FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'best'`,
        [id]
      );
      if (body.bestCase.otherGoodsItems.length > 0) {
        for (let i = 0; i < body.bestCase.otherGoodsItems.length; i++) {
          const item = body.bestCase.otherGoodsItems[i];
          await query(
            `INSERT INTO we_project_vrb_other_goods (vrb_review_id, case_type, item, amount, display_order) VALUES ($1, 'best', $2, $3, $4)`,
            [id, item.item || '', item.amount || 0, i]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API PUT] VRB Review 업데이트 에러:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
    });
    return NextResponse.json(
      {
        error: 'Failed to update VRB review',
        message: error.message,
        detail: error.detail,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

// VRB Review 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // VRB Review 존재 확인
    const existingReview = await query(
      `SELECT id FROM we_project_vrb_reviews WHERE id = $1`,
      [id]
    );

    if (existingReview.rows.length === 0) {
      return NextResponse.json({ error: 'VRB review not found' }, { status: 404 });
    }

    // VRB Review 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const sql = `DELETE FROM we_project_vrb_reviews WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'VRB review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting VRB review:', error);
    return NextResponse.json(
      { error: 'Failed to delete VRB review', message: error.message },
      { status: 500 }
    );
  }
}
