import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const result = await query(`
            SELECT 
                s.*,
                p.project_code,
                p.name as project_name,
                c.name as customer_name,
                -- 실행이익: (사업손익합계 + 부가수익합계)
                -- 사업손익합계: 용역수익 + 상품수익 - (경비소계 + 경상비용)
                -- 부가수익합계: 부가예상수익 - 부가예상비용
                (COALESCE(s.actual_prod_rev_own,0) + COALESCE(s.actual_prod_rev_ext,0)
                 + COALESCE(s.actual_svc_rev_own,0) + COALESCE(s.actual_svc_rev_ext,0))
                - (COALESCE(s.actual_prod_cost_own,0) + COALESCE(s.actual_prod_cost_ext,0)
                   + COALESCE(s.actual_svc_cost_own,0) + COALESCE(s.actual_svc_cost_ext,0)
                   + COALESCE(s.actual_expense_general,0) + COALESCE(s.actual_expense_special,0)
                   + COALESCE(s.actual_biz_cost_indirect,0))
                + (COALESCE(s.actual_extra_revenue,0) - COALESCE(s.actual_extra_cost,0))
                AS actual_profit,
                -- 이익증감: 기준 계획대비 영업이익 증감액
                ((COALESCE(s.actual_prod_rev_own,0) + COALESCE(s.actual_prod_rev_ext,0)
                  + COALESCE(s.actual_svc_rev_own,0) + COALESCE(s.actual_svc_rev_ext,0))
                 - (COALESCE(s.actual_prod_cost_own,0) + COALESCE(s.actual_prod_cost_ext,0)
                    + COALESCE(s.actual_svc_cost_own,0) + COALESCE(s.actual_svc_cost_ext,0)
                    + COALESCE(s.actual_expense_general,0) + COALESCE(s.actual_expense_special,0)
                    + COALESCE(s.actual_biz_cost_indirect,0))
                 + (COALESCE(s.actual_extra_revenue,0) - COALESCE(s.actual_extra_cost,0)))
                - COALESCE(s.planned_profit, 0)
                AS profit_diff_calc
            FROM we_project_settlement s
            LEFT JOIN we_projects p ON s.project_id = p.id
            LEFT JOIN we_clients c ON p.customer_id = c.id
            ORDER BY s.created_at DESC
        `);

        return NextResponse.json({
            settlements: result.rows.map(row => ({
                ...row,
                projectCode: row.project_code,
                customerName: row.customer_name,
                // 실행이익: 정산_2 행의 영업이익과 동일한 공식으로 계산
                actual_profit: Number(row.actual_profit || 0),
                // 이익증감: 기준 계획대비 영업이익 증감액
                profit_diff: Number(row.profit_diff_calc || 0),
            }))
        });
    } catch (error) {
        console.error("Error fetching settlements:", error);
        return NextResponse.json(
            { error: "Failed to fetch settlements" },
            { status: 500 }
        );
    }
}
