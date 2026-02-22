import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 수지분석서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const latestOnly = searchParams.get("latestOnly") === "true";

    let sql = `
      SELECT 
        p.id,
        p.project_id,
        p.version,
        p.status,
        p.version_comment,
        COALESCE(p.total_revenue, 0) as total_revenue,
        COALESCE(p.total_cost, 0) as total_cost,
        COALESCE(p.net_profit, 0) as operating_profit,
        COALESCE(p.profit_rate, 0) as operating_profit_rate,
        TO_CHAR(p.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as created_at,
        TO_CHAR(p.written_date, 'YYYY-MM-DD') as written_date,
        TO_CHAR(p.approved_date, 'YYYY-MM-DD') as approved_date,
        pr.name AS project_name,
        pr.project_code,
        c.name AS customer_name,
        COALESCE(m.our_mm, 0) as our_mm,
        COALESCE(m.others_mm, 0) as others_mm,
        u.name AS creator_name
      FROM we_project_profitability p
      LEFT JOIN we_projects pr ON p.project_id = pr.id
      LEFT JOIN we_clients c ON pr.customer_id = c.id
      LEFT JOIN we_users u ON p.created_by = u.id
      LEFT JOIN (
        SELECT 
          profitability_id,
          SUM(CASE WHEN affiliation_group NOT LIKE '외주%' THEN (SELECT SUM(val::numeric) FROM jsonb_each_text(COALESCE(monthly_allocation, '{}'::jsonb)) AS x(key, val)) ELSE 0 END) as our_mm,
          SUM(CASE WHEN affiliation_group LIKE '외주%' THEN (SELECT SUM(val::numeric) FROM jsonb_each_text(COALESCE(monthly_allocation, '{}'::jsonb)) AS x(key, val)) ELSE 0 END) as others_mm
        FROM we_project_manpower_plan
        GROUP BY profitability_id
      ) m ON p.id = m.profitability_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId && !isNaN(parseInt(projectId, 10))) {
      sql += ` AND p.project_id = $${params.length + 1}`;
      params.push(parseInt(projectId, 10));
    } else {
      // 전체 목록 조회 시 작업이 시작되지 않은(Placeholder) 자료는 제외
      sql += ` AND p.status != 'STANDBY'`;
    }

    if (status) {
      sql += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    if (latestOnly) {
      sql = `
        SELECT DISTINCT ON (project_id) * FROM (${sql} ORDER BY p.project_id, p.version DESC) sub
        ORDER BY project_id, version DESC
      `;
    } else {
      sql += ` ORDER BY p.project_id, p.version DESC`;
    }

    const result = await query(sql, params);

    return NextResponse.json({ profitabilities: result.rows });
  } catch (error: any) {
    console.error("Error fetching profitabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch profitabilities", message: error.message },
      { status: 500 }
    );
  }
}

// 수지분석서 헤더 생성
export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { project_id, version_comment = "" } = body;
    const created_by = user.id;

    if (!project_id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const projectIdNum = parseInt(project_id);

    // 진행 중인 버전 확인
    const draftCheck = await query(
      `SELECT id, version, status FROM we_project_profitability 
       WHERE project_id = $1 AND status IN ('STANDBY', 'IN_PROGRESS') 
       ORDER BY version DESC LIMIT 1`,
      [projectIdNum]
    );

    if (draftCheck.rows.length > 0) {
      const draft = draftCheck.rows[0];
      return NextResponse.json({
        id: draft.id,
        version: draft.version,
        isExisting: true,
        profitability: { id: draft.id, version: draft.version, status: draft.status || 'STANDBY' }
      });
    }

    // 새 버전 생성
    const versionCheck = await query(
      `SELECT COALESCE(MAX(version), 0) as max_version FROM we_project_profitability WHERE project_id = $1`,
      [projectIdNum]
    );
    const newVersion = Number(versionCheck.rows[0].max_version) + 1;

    // created_by를 현재 로그인한 유저로 설정
    const insertResult = await query(
      `INSERT INTO we_project_profitability (project_id, version, status, created_by, version_comment)
       VALUES ($1, $2, 'STANDBY', $3, $4) RETURNING id`,
      [projectIdNum, newVersion, created_by, version_comment]
    );

    const newId = insertResult.rows[0].id;

    // 만약 이전 버전이 존재한다면 데이터 복사 로직
    if (newVersion > 1) {
      const prevVersionResult = await query(
        `SELECT id FROM we_project_profitability WHERE project_id = $1 AND version = $2`,
        [projectIdNum, newVersion - 1]
      );
      if (prevVersionResult.rows.length > 0) {
        const prevId = prevVersionResult.rows[0].id;

        // 인력 계획 복사
        await query(`
          INSERT INTO we_project_manpower_plan (project_id, profitability_id, project_name, role, detailed_task, company_name, affiliation_group, wmb_rank, grade, name, user_id, monthly_allocation, proposed_unit_price, proposed_amount, internal_unit_price, internal_amount)
          SELECT project_id, $1, project_name, role, detailed_task, company_name, affiliation_group, wmb_rank, grade, name, user_id, monthly_allocation, proposed_unit_price, proposed_amount, internal_unit_price, internal_amount
          FROM we_project_manpower_plan WHERE profitability_id = $2
        `, [newId, prevId]);

        // 제품 계획 복사
        await query(`
          INSERT INTO we_project_product_plan (project_id, profitability_id, type, product_id, company_name, product_name, quantity, unit_price, base_price, proposal_price, discount_rate, cost_price, request_date, request_type)
          SELECT project_id, $1, type, product_id, company_name, product_name, quantity, unit_price, base_price, proposal_price, discount_rate, cost_price, request_date, request_type
          FROM we_project_product_plan WHERE profitability_id = $2
        `, [newId, prevId]);

        // 경비 계획 복사
        await query(`
          INSERT INTO we_project_expense_plan (project_id, profitability_id, category, item, monthly_values, is_auto_calculated)
          SELECT project_id, $1, category, item, monthly_values, is_auto_calculated
          FROM we_project_expense_plan WHERE profitability_id = $2
        `, [newId, prevId]);

        // 수지차 데이터 복사
        await query(`
          INSERT INTO we_project_profitability_extra_revenue (project_id, profitability_id, extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc)
          SELECT project_id, $1, extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc
          FROM we_project_profitability_extra_revenue WHERE profitability_id = $2
        `, [newId, prevId]);

        // 수주품의 데이터 복사
        await query(`
          INSERT INTO we_project_order_proposal (project_id, profitability_id, contract_type, contract_category, main_contract, main_operator, execution_location, overview, special_notes, risk, payment_terms, partners)
          SELECT project_id, $1, contract_type, contract_category, main_contract, main_operator, execution_location, overview, special_notes, risk, payment_terms, partners
          FROM we_project_order_proposal WHERE profitability_id = $2
        `, [newId, prevId]);
      }
    }

    return NextResponse.json({
      id: newId,
      version: newVersion,
      profitability: { id: newId, version: newVersion, status: 'STANDBY' }
    });
  } catch (error: any) {
    console.error("Error creating profitability:", error);
    return NextResponse.json(
      { error: "Failed to create profitability", message: error.message },
      { status: 500 }
    );
  }
}
