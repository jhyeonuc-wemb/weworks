import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 프로젝트 경비 계획 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const result = await query(
            `SELECT 
        id,
        project_id,
        category,
        item,
        monthly_values,
        is_auto_calculated,
        created_at,
        updated_at
      FROM we_project_expense_plan
      WHERE project_id = $1
      ORDER BY category ASC, id ASC`,
            [projectId]
        );

        const items = result.rows.map((row: any) => ({
            id: row.id,
            category: row.category,
            item: row.item,
            monthlyValues: row.monthly_values || {},
            isAutoCalculated: row.is_auto_calculated,
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
        console.error("Error fetching expense plan:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense plan" },
            { status: 500 }
        );
    }
}

// 프로젝트 경비 계획 저장
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);
        const { items, startMonth, endMonth } = await request.json();

        // 기존 경비 계획 삭제
        await query(
            "DELETE FROM we_project_expense_plan WHERE project_id = $1",
            [projectId]
        );

        // 새 경비 계획 삽입
        for (const item of items) {
            await query(
                `INSERT INTO we_project_expense_plan (
          project_id,
          category,
          item,
          monthly_values,
          is_auto_calculated
        ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    projectId,
                    item.category,
                    item.item,
                    JSON.stringify(item.monthlyValues),
                    item.isAutoCalculated,
                ]
            );
        }

        // 수지분석서 상태 업데이트 ('not_started' -> 'in_progress') 또는 신규 생성
        const analysisStartDate = startMonth ? `${startMonth}-01` : null;
        const analysisEndDate = endMonth ? `${endMonth}-01` : null;

        const checkRes = await query(
            `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress')`,
            [projectId]
        );

        if (checkRes.rows.length > 0) {
            await query(
                `UPDATE we_project_profitability 
         SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
         WHERE project_id = $1 AND status = 'not_started'`,
                [projectId]
            );
            // 날짜 업데이트
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
        console.error("Error saving expense plan:", error);
        return NextResponse.json(
            { error: "Failed to save expense plan", details: error.message },
            { status: 500 }
        );
    }
}
