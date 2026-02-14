import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 프로젝트 경비 계획 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const searchParams = request.nextUrl.searchParams;
        const profitabilityId = searchParams.get("profitabilityId");

        console.log("Fetching expense plan for project:", projectId, "profitabilityId:", profitabilityId);

        let sql = `SELECT id, project_id, category, item, monthly_values, is_auto_calculated, created_at, updated_at FROM we_project_expense_plan`;
        const dbParams: any[] = [];

        if (profitabilityId) {
            sql += ` WHERE profitability_id = $1`;
            dbParams.push(parseInt(profitabilityId));
        } else {
            sql += ` WHERE project_id = $1 AND profitability_id = (SELECT id FROM we_project_profitability WHERE project_id = $1 ORDER BY version DESC LIMIT 1)`;
            dbParams.push(projectId);
        }

        sql += ` ORDER BY category ASC, id ASC`;

        const result = await query(sql, dbParams);

        const items = result.rows.map((row: any) => ({
            id: row.id,
            category: row.category,
            item: row.item,
            monthlyValues: row.monthly_values || {},
            isAutoCalculated: row.is_auto_calculated,
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
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);
        const { items, startMonth, endMonth, profitabilityId: bodyProfitabilityId } = await request.json();
        const searchParams = request.nextUrl.searchParams;
        let profitabilityId = bodyProfitabilityId || searchParams.get("profitabilityId");

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
            const versionCheck = await query(`SELECT COALESCE(MAX(version), 0) as max_v FROM we_project_profitability WHERE project_id = $1`, [projectId]);
            const newV = versionCheck.rows[0].max_v + 1;
            const insRes = await query(`INSERT INTO we_project_profitability (project_id, version, status, created_by) VALUES ($1, $2, 'STANDBY', $3) RETURNING id`, [projectId, newV, user.id]);
            profitabilityId = insRes.rows[0].id;
        }

        // 기존 경비 계획 삭제
        await query(
            "DELETE FROM we_project_expense_plan WHERE profitability_id = $1",
            [profitabilityId]
        );

        // 새 경비 계획 삽입
        for (const item of items) {
            await query(
                `INSERT INTO we_project_expense_plan (
          project_id, profitability_id, category, item, monthly_values, is_auto_calculated
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    projectId,
                    profitabilityId,
                    item.category,
                    item.item,
                    JSON.stringify(item.monthlyValues),
                    item.isAutoCalculated,
                ]
            );
        }

        if (profitabilityId) {
            const analysisStartDate = startMonth ? `${startMonth}-01` : null;
            const analysisEndDate = endMonth ? `${endMonth}-01` : null;
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
        console.error("Error saving expense plan:", error);
        return NextResponse.json(
            { error: "Failed to save expense plan", details: error.message },
            { status: 500 }
        );
    }
}
