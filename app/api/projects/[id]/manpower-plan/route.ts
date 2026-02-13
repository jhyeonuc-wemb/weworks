import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 인력 계획 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    const searchParams = request.nextUrl.searchParams;
    const profitabilityId = searchParams.get("profitabilityId");

    let sql = `
      SELECT 
        id, project_name, role, detailed_task, company_name, affiliation_group, wmb_rank, grade, name, user_id,
        monthly_allocation, proposed_unit_price, proposed_amount, internal_unit_price, internal_amount, profitability_id
      FROM we_project_manpower_plan
    `;
    const dbParams: any[] = [];

    if (profitabilityId) {
      sql += ` WHERE profitability_id = $1`;
      dbParams.push(parseInt(profitabilityId));
    } else {
      sql += ` WHERE project_id = $1 AND profitability_id = (SELECT id FROM we_project_profitability WHERE project_id = $1 ORDER BY version DESC LIMIT 1)`;
      dbParams.push(projectId);
    }

    sql += ` ORDER BY id ASC`;

    const result = await query(sql, dbParams);

    const items = result.rows.map((row: any) => ({
      id: row.id,
      projectName: row.project_name,
      role: row.role,
      detailedTask: row.detailed_task,
      companyName: row.company_name,
      affiliationGroup: row.affiliation_group,
      wmbRank: row.wmb_rank,
      grade: row.grade,
      name: row.name,
      userId: row.user_id,
      monthlyAllocation: row.monthly_allocation || {},
      proposedUnitPrice: row.proposed_unit_price ? Number(row.proposed_unit_price) : null,
      proposedAmount: row.proposed_amount ? Number(row.proposed_amount) : null,
      internalUnitPrice: row.internal_unit_price ? Number(row.internal_unit_price) : null,
      internalAmount: row.internal_amount ? Number(row.internal_amount) : null,
    }));

    // 수지분석서 헤더에서 기간 조회
    let profSql = `SELECT id, analysis_start_date, analysis_end_date FROM we_project_profitability`;
    const profParams: any[] = [];

    if (profitabilityId) {
      profSql += ` WHERE id = $1`;
      profParams.push(parseInt(profitabilityId));
    } else {
      profSql += ` WHERE project_id = $1 ORDER BY version DESC LIMIT 1`;
      profParams.push(projectId);
    }

    const profResult = await query(profSql, profParams);

    let analysisStartMonth = "";
    let analysisEndMonth = "";

    if (profResult.rows.length > 0) {
      const row = profResult.rows[0];
      if (row.analysis_start_date) {
        const d = new Date(row.analysis_start_date);
        analysisStartMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      if (row.analysis_end_date) {
        const d = new Date(row.analysis_end_date);
        analysisEndMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    return NextResponse.json({ items, analysisStartMonth, analysisEndMonth });
  } catch (error) {
    console.error("Error fetching manpower plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch manpower plan" },
      { status: 500 }
    );
  }
}

// 인력 계획 저장
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { items, startMonth, endMonth, profitabilityId: bodyProfitabilityId } = body;
    const searchParams = request.nextUrl.searchParams;
    let profitabilityId = bodyProfitabilityId || searchParams.get("profitabilityId");

    console.log("Saving manpower plan for project:", projectId, "profitabilityId:", profitabilityId);

    // profitabilityId 가 없으면 최신 draft/not_started 찾기
    if (!profitabilityId) {
      const draftRes = await query(
        `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('STANDBY', 'IN_PROGRESS') ORDER BY version DESC LIMIT 1`,
        [projectId]
      );
      if (draftRes.rows.length > 0) {
        profitabilityId = draftRes.rows[0].id;
      }
    }

    if (!profitabilityId) {
      // 신규 버전 생성
      const versionCheck = await query(`SELECT COALESCE(MAX(version), 0) as max_v FROM we_project_profitability WHERE project_id = $1`, [projectId]);
      const newV = versionCheck.rows[0].max_v + 1;
      const insRes = await query(`INSERT INTO we_project_profitability (project_id, version, status, created_by) VALUES ($1, $2, 'STANDBY', 1) RETURNING id`, [projectId, newV]);
      profitabilityId = insRes.rows[0].id;
    }

    // 기존 인력 계획 삭제 (해당 분석서 ID 기준)
    await query(
      "DELETE FROM we_project_manpower_plan WHERE profitability_id = $1",
      [profitabilityId]
    );

    // 새 인력 계획 삽입
    for (const item of items) {
      await query(
        `INSERT INTO we_project_manpower_plan (
          project_id, profitability_id, project_name, role, detailed_task, company_name,
          affiliation_group, wmb_rank, grade, name, user_id, monthly_allocation,
          proposed_unit_price, proposed_amount, internal_unit_price, internal_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          projectId,
          profitabilityId,
          item.projectName,
          item.role,
          item.detailedTask,
          item.companyName,
          item.affiliationGroup,
          item.wmbRank,
          item.grade,
          item.name,
          item.userId,
          JSON.stringify(item.monthlyAllocation),
          item.proposedUnitPrice,
          item.proposedAmount,
          item.internalUnitPrice,
          item.internalAmount,
        ]
      );
    }

    // 수지분석서 상태 업데이트 및 기간 저장
    const analysisStartDate = startMonth ? `${startMonth}-01` : null;
    const analysisEndDate = endMonth ? `${endMonth}-01` : null;

    if (profitabilityId) {
      await query(
        `UPDATE we_project_profitability 
         SET status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END,
             updated_at = CURRENT_TIMESTAMP,
             analysis_start_date = COALESCE($2, analysis_start_date),
             analysis_end_date = COALESCE($3, analysis_end_date)
         WHERE id = $1`,
        [profitabilityId, analysisStartDate, analysisEndDate]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving manpower plan:", error);
    return NextResponse.json(
      { error: "Failed to save manpower plan", details: error.message },
      { status: 500 }
    );
  }
}
