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

    // 인력 계획 조회
    const result = await query(
      `SELECT 
        id,
        project_name,
        role,
        detailed_task,
        company_name,
        affiliation_group,
        wmb_rank,
        grade,
        name,
        user_id,
        monthly_allocation,
        proposed_unit_price,
        proposed_amount,
        internal_unit_price,
        internal_amount
      FROM we_project_manpower_plan
      WHERE project_id = $1
      ORDER BY id ASC`,
      [projectId]
    );

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
    const profResult = await query(
      `SELECT analysis_start_date, analysis_end_date 
       FROM we_project_profitability 
       WHERE project_id = $1 AND status IN ('not_started', 'in_progress', 'review', 'rejected', 'completed', 'approved')
       ORDER BY version DESC LIMIT 1`,
      [projectId]
    );

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
    const { items, startMonth, endMonth } = await request.json();

    console.log("Saving manpower plan for project:", projectId);

    // 기존 인력 계획 삭제
    await query(
      "DELETE FROM we_project_manpower_plan WHERE project_id = $1",
      [projectId]
    );

    // 새 인력 계획 삽입
    for (const item of items) {
      await query(
        `INSERT INTO we_project_manpower_plan (
          project_id,
          project_name,
          role,
          detailed_task,
          company_name,
          affiliation_group,
          wmb_rank,
          grade,
          name,
          user_id,
          monthly_allocation,
          proposed_unit_price,
          proposed_amount,
          internal_unit_price,
          internal_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          projectId,
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

    const checkRes = await query(
      `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress')`,
      [projectId]
    );

    if (checkRes.rows.length > 0) {
      await query(
        `UPDATE we_project_profitability 
         SET status = 'in_progress', 
             updated_at = CURRENT_TIMESTAMP,
             analysis_start_date = COALESCE($2, analysis_start_date),
             analysis_end_date = COALESCE($3, analysis_end_date)
         WHERE project_id = $1 AND status = 'not_started'`,
        [projectId, analysisStartDate, analysisEndDate]
      );
      // 만약 status가 'in_progress'라면 status 업데이트는 필요없지만 날짜는 업데이트 해야 함.
      // 위 쿼리는 status='not_started'인 경우만 업데이트함.
      // 별도로 status 상관없이 날짜 업데이트 (draft 상태인 경우)
      await query(
        `UPDATE we_project_profitability 
         SET updated_at = CURRENT_TIMESTAMP,
             analysis_start_date = COALESCE($2, analysis_start_date),
             analysis_end_date = COALESCE($3, analysis_end_date)
         WHERE project_id = $1 AND status IN ('not_started', 'in_progress')`,
        [projectId, analysisStartDate, analysisEndDate]
      );
    } else {
      // 진행 중인 건이 없으면 새로 생성
      const versionCheck = await query(
        `SELECT MAX(version) AS max_version FROM we_project_profitability WHERE project_id = $1 AND status = 'completed'`,
        [projectId]
      );
      const newVersion = Number(versionCheck.rows[0]?.max_version || 0) + 1;

      await query(
        `INSERT INTO we_project_profitability (
          project_id, version, status, created_by, analysis_start_date, analysis_end_date
        ) VALUES ($1, $2, 'in_progress', 1, $3, $4)`,
        [projectId, newVersion, analysisStartDate, analysisEndDate]
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
