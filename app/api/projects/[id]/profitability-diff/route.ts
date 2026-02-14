import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 수지차 부가수익 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        const searchParams = request.nextUrl.searchParams;
        const profitabilityId = searchParams.get("profitabilityId");

        let sql = `
          SELECT extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc
          FROM we_project_profitability_extra_revenue
        `;
        const dbParams: any[] = [];

        if (profitabilityId && profitabilityId !== "undefined" && profitabilityId !== "null") {
            sql += ` WHERE profitability_id = $1`;
            dbParams.push(parseInt(profitabilityId));
        } else {
            const projectIdNum = parseInt(projectId);
            if (isNaN(projectIdNum)) {
                return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
            }
            sql += ` WHERE project_id = $1 AND profitability_id = (SELECT id FROM we_project_profitability WHERE project_id = $2 ORDER BY version DESC LIMIT 1)`;
            dbParams.push(projectIdNum, projectIdNum);
        }

        const result = await query(sql, dbParams);

        if (result.rows.length === 0) {
            return NextResponse.json({
                extraRevenue: 0,
                extraRevenueDesc: "",
                extraExpense: 0,
                extraExpenseDesc: "",
            });
        }

        const row = result.rows[0];
        return NextResponse.json({
            extraRevenue: Number(row.extra_revenue),
            extraRevenueDesc: row.extra_revenue_desc || "",
            extraExpense: Number(row.extra_expense),
            extraExpenseDesc: row.extra_expense_desc || "",
        });
    } catch (error: any) {
        console.error("Error fetching profitability extra revenue:", error);
        return NextResponse.json(
            { error: "Failed to fetch data", message: error.message },
            { status: 500 }
        );
    }
}

// 수지차 부가수익 저장 및 전체 요약 갱신
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const { id: projectId } = await params;
        const body = await request.json();
        const {
            extraRevenue,
            extraRevenueDesc,
            extraExpense,
            extraExpenseDesc,
            // 최종 요약 정보
            totalRevenue,
            totalCost,
            netProfit,
            profitRate,
            profitabilityId: bodyProfitabilityId
        } = body;
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
            const insRes = await query(
                `INSERT INTO we_project_profitability (project_id, version, status, created_by) 
                 VALUES ($1, $2, 'STANDBY', $3) 
                 RETURNING id`,
                [projectId, newV, user.id]
            );
            profitabilityId = insRes.rows[0].id;
        }

        // 1. 부가수익 데이터 UPSERT (profitability_id 기준)
        const extraSql = `
          INSERT INTO we_project_profitability_extra_revenue (
            project_id, profitability_id, extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (profitability_id) DO UPDATE SET
            extra_revenue = EXCLUDED.extra_revenue,
            extra_revenue_desc = EXCLUDED.extra_revenue_desc,
            extra_expense = EXCLUDED.extra_expense,
            extra_expense_desc = EXCLUDED.extra_expense_desc,
            updated_at = CURRENT_TIMESTAMP
        `;
        await query(extraSql, [
            projectId,
            profitabilityId,
            extraRevenue,
            extraRevenueDesc,
            extraExpense,
            extraExpenseDesc,
        ]);

        // 2. 수지분석서 헤더 요약 정보 갱신
        if (profitabilityId) {
            await query(`
              UPDATE we_project_profitability
              SET 
                total_revenue = $2,
                total_cost = $3,
                net_profit = $4,
                profit_rate = $5,
                status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
            `, [
                profitabilityId,
                totalRevenue,
                totalCost,
                netProfit,
                profitRate,
            ]);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving profitability diff and summary:", error);
        return NextResponse.json(
            { error: "Failed to save data", message: error.message },
            { status: 500 }
        );
    }
}
