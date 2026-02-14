import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);
        if (isNaN(projectId)) {
            return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
        }

        // 정산서 조회
        const settlementResult = await query(
            `SELECT id, project_id, profitability_id, 
                    TO_CHAR(settlement_date, 'YYYY-MM-DD') as settlement_date,
                    TO_CHAR(approved_date, 'YYYY-MM-DD') as approved_date,
                    planned_revenue, planned_cost, planned_labor_cost, planned_other_cost,
                    planned_profit, planned_profit_rate,
                    actual_revenue, actual_cost, actual_labor_cost, actual_other_cost,
                    actual_prod_rev_own, actual_prod_rev_ext, actual_svc_rev_own, actual_svc_rev_ext,
                    actual_prod_cost_own, actual_prod_cost_ext, actual_svc_cost_own, actual_svc_cost_ext,
                    actual_svc_mm_own, actual_svc_mm_ext, actual_expense_general, actual_expense_special,
                    planned_svc_mm_own, planned_svc_mm_ext,
                    notes, status, created_at, updated_at, created_by
             FROM we_project_settlement WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [projectId]
        );

        if (settlementResult.rows.length === 0) {
            return NextResponse.json(
                { settlement: null, labor: [], extCompanies: [] },
                { status: 200 }
            );
        }

        const settlement = settlementResult.rows[0];

        // 인력 데이터 조회
        const laborResult = await query(
            `SELECT * FROM we_project_settlement_labor WHERE settlement_id = $1 ORDER BY display_order, id`,
            [settlement.id]
        );

        // 외주 업체 데이터 조회
        const extCompaniesResult = await query(
            `SELECT * FROM we_project_settlement_ext_company WHERE settlement_id = $1 ORDER BY display_order, id`,
            [settlement.id]
        );

        return NextResponse.json({
            settlement,
            labor: laborResult.rows,
            extCompanies: extCompaniesResult.rows,
        });
    } catch (error) {
        console.error("Error fetching settlement:", error);
        return NextResponse.json(
            { error: "Failed to fetch settlement" },
            { status: 500 }
        );
    }
}

export async function POST(
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
        const body = await request.json();
        const { settlement, labor, extCompanies } = body;

        // 정산서 생성
        const settlementResult = await query(
            `INSERT INTO we_project_settlement (
                project_id, profitability_id, settlement_date, approved_date,
                planned_revenue, planned_cost, planned_labor_cost, planned_other_cost,
                planned_profit, planned_profit_rate,
                actual_revenue, actual_cost, actual_labor_cost, actual_other_cost,
                actual_prod_rev_own, actual_prod_rev_ext, actual_svc_rev_own, actual_svc_rev_ext,
                actual_prod_cost_own, actual_prod_cost_ext, actual_svc_cost_own, actual_svc_cost_ext,
                actual_svc_mm_own, actual_svc_mm_ext, actual_expense_general, actual_expense_special,
                notes, status, created_by, planned_svc_mm_own, planned_svc_mm_ext
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
            RETURNING *`,
            [
                projectId,
                settlement.profitability_id,
                settlement.settlement_date,
                settlement.approved_date || null,
                settlement.planned_revenue,
                settlement.planned_cost,
                settlement.planned_labor_cost,
                settlement.planned_other_cost,
                settlement.planned_profit,
                settlement.planned_profit_rate,
                settlement.actual_revenue,
                settlement.actual_cost,
                settlement.actual_labor_cost,
                settlement.actual_other_cost,
                settlement.actual_prod_rev_own || 0,
                settlement.actual_prod_rev_ext || 0,
                settlement.actual_svc_rev_own || 0,
                settlement.actual_svc_rev_ext || 0,
                settlement.actual_prod_cost_own || 0,
                settlement.actual_prod_cost_ext || 0,
                settlement.actual_svc_cost_own || 0,
                settlement.actual_svc_cost_ext || 0,
                settlement.actual_svc_mm_own || 0,
                settlement.actual_svc_mm_ext || 0,
                settlement.actual_expense_general || 0,
                settlement.actual_expense_special || 0,
                settlement.notes,
                settlement.status || 'STANDBY',
                user.id,
                settlement.planned_svc_mm_own || 0,
                settlement.planned_svc_mm_ext || 0,
            ]
        );

        const newSettlement = settlementResult.rows[0];

        // 인력 데이터 생성
        if (labor && labor.length > 0) {
            for (let i = 0; i < labor.length; i++) {
                const item = labor[i];
                await query(
                    `INSERT INTO we_project_settlement_labor (
                        settlement_id, user_id, user_name, role,
                        planned_mm, planned_cost, actual_mm, actual_cost,
                        display_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        newSettlement.id,
                        item.user_id,
                        item.user_name,
                        item.role,
                        item.planned_mm,
                        item.planned_cost,
                        item.actual_mm,
                        item.actual_cost,
                        i,
                    ]
                );
            }
        }

        // 외주 업체 데이터 생성
        if (extCompanies && extCompanies.length > 0) {
            for (let i = 0; i < extCompanies.length; i++) {
                const item = extCompanies[i];
                await query(
                    `INSERT INTO we_project_settlement_ext_company (
                        settlement_id, company_name, role1, role2,
                        plan_mm, plan_amt, exec_mm, exec_amt,
                        display_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        newSettlement.id,
                        item.companyName,
                        item.role1,
                        item.role2,
                        item.planMM || {},
                        item.planAmt || {},
                        item.execMM || {},
                        item.execAmt || {},
                        i
                    ]
                );
            }
        }

        return NextResponse.json({ settlement: newSettlement });
    } catch (error) {
        console.error("Error creating settlement:", error);
        return NextResponse.json(
            { error: "Failed to create settlement" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();
        const { settlement, labor, extCompanies } = body;

        // 정산서 업데이트
        const settlementResult = await query(
            `UPDATE we_project_settlement SET
                settlement_date = $1,
                approved_date = $2,
                actual_revenue = $3,
                actual_cost = $4,
                actual_labor_cost = $5,
                actual_other_cost = $6,
                actual_prod_rev_own = $7,
                actual_prod_rev_ext = $8,
                actual_svc_rev_own = $9,
                actual_svc_rev_ext = $10,
                actual_prod_cost_own = $11,
                actual_prod_cost_ext = $12,
                actual_svc_cost_own = $13,
                actual_svc_cost_ext = $14,
                actual_svc_mm_own = $15,
                actual_svc_mm_ext = $16,
                actual_expense_general = $17,
                actual_expense_special = $18,
                notes = $19,
                status = $20,
                planned_svc_mm_own = $21,
                planned_svc_mm_ext = $22,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $23
            RETURNING *`,
            [
                settlement.settlement_date,
                settlement.approved_date || null,
                settlement.actual_revenue,
                settlement.actual_cost,
                settlement.actual_labor_cost,
                settlement.actual_other_cost,
                settlement.actual_prod_rev_own || 0,
                settlement.actual_prod_rev_ext || 0,
                settlement.actual_svc_rev_own || 0,
                settlement.actual_svc_rev_ext || 0,
                settlement.actual_prod_cost_own || 0,
                settlement.actual_prod_cost_ext || 0,
                settlement.actual_svc_cost_own || 0,
                settlement.actual_svc_cost_ext || 0,
                settlement.actual_svc_mm_own || 0,
                settlement.actual_svc_mm_ext || 0,
                settlement.actual_expense_general || 0,
                settlement.actual_expense_special || 0,
                settlement.notes,
                settlement.status || 'STANDBY',
                settlement.planned_svc_mm_own || 0,
                settlement.planned_svc_mm_ext || 0,
                settlement.id,
            ]
        );

        if (settlementResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Settlement not found" },
                { status: 404 }
            );
        }

        const updatedSettlement = settlementResult.rows[0];

        // 정산서가 완료되면 프로젝트 상태도 업데이트
        if (updatedSettlement.status === 'COMPLETED') {
            try {
                console.log(`Settlement COMPLETED. Updating project ${projectId} status to completed`);
                await query(
                    "UPDATE we_projects SET status = 'completed', current_phase = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                    [projectId]
                );
            } catch (err) {
                console.error(`Failed to update project status for ${projectId}:`, err);
            }
        }

        // 기존 데이터 삭제
        await query(`DELETE FROM we_project_settlement_labor WHERE settlement_id = $1`, [settlement.id]);
        await query(`DELETE FROM we_project_settlement_ext_company WHERE settlement_id = $1`, [settlement.id]);

        // 인력 데이터 재생성
        if (labor && labor.length > 0) {
            for (let i = 0; i < labor.length; i++) {
                const item = labor[i];
                await query(
                    `INSERT INTO we_project_settlement_labor (
                        settlement_id, user_id, user_name, role,
                        planned_mm, planned_cost, actual_mm, actual_cost,
                        display_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        settlement.id,
                        item.user_id,
                        item.user_name,
                        item.role,
                        item.planned_mm,
                        item.planned_cost,
                        item.actual_mm,
                        item.actual_cost,
                        i,
                    ]
                );
            }
        }

        // 외주 업체 데이터 재생성
        if (extCompanies && extCompanies.length > 0) {
            for (let i = 0; i < extCompanies.length; i++) {
                const item = extCompanies[i];
                await query(
                    `INSERT INTO we_project_settlement_ext_company (
                        settlement_id, company_name, role1, role2,
                        plan_mm, plan_amt, exec_mm, exec_amt,
                        display_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        settlement.id,
                        item.companyName,
                        item.role1,
                        item.role2,
                        item.planMM || {},
                        item.planAmt || {},
                        item.execMM || {},
                        item.execAmt || {},
                        i
                    ]
                );
            }
        }

        return NextResponse.json({ settlement: settlementResult.rows[0] });
    } catch (error) {
        console.error("Error updating settlement:", error);
        return NextResponse.json(
            { error: "Failed to update settlement" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
        }

        // 정산서 삭제 (결합된 테이블들도 CASCADE 설정에 의해 삭제됨)
        await query(`DELETE FROM we_project_settlement WHERE project_id = $1`, [projectId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting settlement:", error);
        return NextResponse.json(
            { error: "Failed to delete settlement" },
            { status: 500 }
        );
    }
}
