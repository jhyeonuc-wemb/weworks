import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 수지차 부가수익 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        const sql = `
      SELECT extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc
      FROM we_project_profitability_extra_revenue
      WHERE project_id = $1
    `;
        const result = await query(sql, [projectId]);

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
        } = body;

        // 1. 부가수익 데이터 UPSERT
        const extraSql = `
      INSERT INTO we_project_profitability_extra_revenue (
        project_id, extra_revenue, extra_revenue_desc, extra_expense, extra_expense_desc, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id) DO UPDATE SET
        extra_revenue = EXCLUDED.extra_revenue,
        extra_revenue_desc = EXCLUDED.extra_revenue_desc,
        extra_expense = EXCLUDED.extra_expense,
        extra_expense_desc = EXCLUDED.extra_expense_desc,
        updated_at = CURRENT_TIMESTAMP
    `;
        await query(extraSql, [
            projectId,
            extraRevenue,
            extraRevenueDesc,
            extraExpense,
            extraExpenseDesc,
        ]);

        // 2. 수지분석서 헤더 요약 정보 갱신 (가장 최신 draft or in_progress 버전)
        // PostgreSQL에서는 UPDATE ... ORDER BY ... LIMIT 1이 직접 지원되지 않으므로 서브쿼리 사용
        const headerSql = `
      UPDATE we_project_profitability
      SET 
        total_revenue = $2,
        total_cost = $3,
        net_profit = $4,
        profit_rate = $5,
        status = 'in_progress',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id FROM we_project_profitability 
        WHERE project_id = $1 AND status != 'completed'
        ORDER BY version DESC
        LIMIT 1
      )
    `;
        const updateResult = await query(headerSql, [
            projectId,
            totalRevenue,
            totalCost,
            netProfit,
            profitRate,
        ]);

        if (updateResult.rowCount === 0) {
            // 진행 중인 건이 없으면 새로 생성
            const versionCheck = await query(
                `SELECT MAX(version) AS max_version FROM we_project_profitability WHERE project_id = $1 AND status = 'completed'`,
                [projectId]
            );
            const newVersion = Number(versionCheck.rows[0]?.max_version || 0) + 1;

            await query(
                `INSERT INTO we_project_profitability (
                  project_id, version, status, created_by,
                  total_revenue, total_cost, net_profit, profit_rate
                ) VALUES ($1, $2, 'in_progress', 1, $3, $4, $5, $6)`,
                [
                    projectId,
                    newVersion,
                    totalRevenue,
                    totalCost,
                    netProfit,
                    profitRate
                ]
            );
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
