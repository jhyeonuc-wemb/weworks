import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// VRB Review 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        v.id,
        v.project_id,
        v.version,
        v.status,
        v.project_budget,
        v.win_probability,
        v.win_date,
        v.business_type,
        v.partners,
        v.partner_info,
        v.competitors,
        v.customer_info,
        v.sales_manager,
        v.ps_manager,
        v.expected_start_date,
        v.expected_end_date,
        v.main_contractor,
        v.key_solutions,
        v.business_background,
        v.business_scope,
        v.risk,
        v.business_basis,
        v.worst_estimated_revenue_goods,
        v.worst_estimated_revenue_services,
        v.worst_estimated_revenue_hw,
        v.worst_estimated_mm,
        v.worst_other_goods_purchase,
        v.worst_existing_system_linkage,
        v.worst_risk_cost_percent,
        v.worst_risk_cost_base,
        v.worst_external_purchase_percent,
        v.worst_external_purchase_base,
        v.worst_external_purchase2_percent,
        v.worst_external_purchase2_base,
        v.worst_include_external_purchase,
        v.worst_include_external_purchase2,
        v.worst_operating_profit,
        v.worst_operating_profit_percent,
        v.worst_operating_profit2,
        v.worst_operating_profit2_percent,
        v.best_estimated_revenue_goods,
        v.best_estimated_revenue_services,
        v.best_estimated_revenue_hw,
        v.best_estimated_mm,
        v.best_other_goods_purchase,
        v.best_existing_system_linkage,
        v.best_risk_cost_percent,
        v.best_risk_cost_base,
        v.best_external_purchase_percent,
        v.best_external_purchase_base,
        v.best_external_purchase2_percent,
        v.best_external_purchase2_base,
        v.best_include_external_purchase,
        v.best_include_external_purchase2,
        v.best_operating_profit,
        v.best_operating_profit_percent,
        v.best_operating_profit2,
        v.best_operating_profit2_percent,
        v.md_estimation_id,
        v.review_result,
        v.created_at,
        p.name as project_name,
        p.project_code,
        c.name as customer_name
      FROM we_project_vrb_reviews v
      LEFT JOIN we_projects p ON v.project_id = p.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId) {
      sql += ` AND v.project_id = $${params.length + 1}`;
      // project_id를 명시적으로 숫자로 변환
      params.push(parseInt(projectId, 10));
      console.log('[API GET] projectId 필터링:', {
        original: projectId,
        parsed: parseInt(projectId, 10),
        type: typeof parseInt(projectId, 10)
      });
    }

    if (status) {
      sql += ` AND v.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY v.project_id, v.version DESC`;

    const result = await query(sql, params);

    console.log('[API GET] 조회 결과:', {
      projectId: projectId,
      '조회된 개수': result.rows.length,
      '각 리뷰의 project_id': result.rows.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        project_id_type: typeof r.project_id,
        status: r.status,
        version: r.version
      }))
    });

    // 각 VRB Review에 대해 서브 데이터 가져오기
    const reviews = await Promise.all(
      result.rows.map(async (review: any) => {
        // 주요내용
        const contentsResult = await query(
          `SELECT * FROM we_project_vrb_key_contents WHERE vrb_review_id = $1 ORDER BY display_order, id`,
          [review.id]
        );

        // 주요활동
        const activitiesResult = await query(
          `SELECT * FROM we_project_vrb_key_activities WHERE vrb_review_id = $1 ORDER BY display_order, id`,
          [review.id]
        );

        // 프로젝트 수행 비용 (Worst)
        const worstCostsResult = await query(
          `SELECT * FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
          [review.id]
        );

        // 프로젝트 수행 비용 (Best)
        const bestCostsResult = await query(
          `SELECT * FROM we_project_vrb_project_costs WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
          [review.id]
        );

        // 예상 M/M 항목 (Worst)
        const worstMmItemsResult = await query(
          `SELECT * FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
          [review.id]
        );

        // 예상 M/M 항목 (Best)
        const bestMmItemsResult = await query(
          `SELECT * FROM we_project_vrb_estimated_mm_items WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
          [review.id]
        );

        // 타사 상품 매입 항목 (Worst)
        const worstOtherGoodsResult = await query(
          `SELECT * FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'worst' ORDER BY display_order, id`,
          [review.id]
        );

        // 타사 상품 매입 항목 (Best)
        const bestOtherGoodsResult = await query(
          `SELECT * FROM we_project_vrb_other_goods WHERE vrb_review_id = $1 AND case_type = 'best' ORDER BY display_order, id`,
          [review.id]
        );

        return {
          ...review,
          keyContents: contentsResult.rows,
          keyActivities: activitiesResult.rows,
          worstCase: {
            ...review,
            projectCosts: worstCostsResult.rows,
            estimatedMmItems: worstMmItemsResult.rows,
            otherGoodsItems: worstOtherGoodsResult.rows,
          },
          bestCase: {
            ...review,
            projectCosts: bestCostsResult.rows,
            estimatedMmItems: bestMmItemsResult.rows,
            otherGoodsItems: bestOtherGoodsResult.rows,
          },
        };
      })
    );

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error fetching VRB reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VRB reviews', message: error.message },
      { status: 500 }
    );
  }
}

// VRB Review 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, version, created_by = 1 } = body;

    // 프로젝트 ID 필수 검증
    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // 프로젝트 존재 여부 확인
    const projectCheck = await query(
      `SELECT id FROM we_projects WHERE id = $1`,
      [project_id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 최신 버전 확인
    const versionCheck = await query(
      `SELECT MAX(version) as max_version FROM we_project_vrb_reviews WHERE project_id = $1`,
      [project_id]
    );
    const maxVersion = versionCheck.rows[0]?.max_version || 0;

    // 버전이 명시되지 않았으면 자동 증가, 명시되었으면 해당 버전 사용
    const newVersion = version ?? (maxVersion + 1);

    // 최신 M/D 산정 가져오기
    const mdEstimationResult = await query(
      `SELECT id FROM we_project_md_estimations WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
      [project_id]
    );
    const mdEstimationId = mdEstimationResult.rows[0]?.id || null;

    const sql = `
      INSERT INTO we_project_vrb_reviews (
        project_id, version, status, created_by, md_estimation_id
      ) VALUES ($1, $2, 'STANDBY', $3, $4)
      RETURNING id
    `;

    const result = await query(sql, [project_id, newVersion, created_by, mdEstimationId]);

    return NextResponse.json({ id: result.rows[0].id, version: newVersion });
  } catch (error: any) {
    console.error('Error creating VRB review:', error);
    return NextResponse.json(
      { error: 'Failed to create VRB review', message: error.message },
      { status: 500 }
    );
  }
}
