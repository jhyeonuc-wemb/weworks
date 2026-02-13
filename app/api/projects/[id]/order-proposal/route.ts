import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const defaultPaymentTerms = {
    labor: [
        { rate: "", timing: "" },
        { rate: "", timing: "" },
        { rate: "", timing: "" },
        { rate: "", timing: "" }
    ],
    product: [
        { rate: "", timing: "" },
        { rate: "", timing: "" },
        { rate: "", timing: "" },
        { rate: "", timing: "" }
    ]
};

// 수주품의 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        const searchParams = request.nextUrl.searchParams;
        const profitabilityId = searchParams.get("profitabilityId");

        console.log("Fetching order proposal for project:", projectId, "profitabilityId:", profitabilityId);

        let sql = `
            SELECT op.*, 
                   TO_CHAR(p.written_date, 'YYYY-MM-DD') as written_date, 
                   TO_CHAR(p.approved_date, 'YYYY-MM-DD') as approved_date 
            FROM we_project_order_proposal op
            LEFT JOIN we_project_profitability p ON op.profitability_id = p.id
        `;
        const dbParams: any[] = [];

        if (profitabilityId) {
            sql += ` WHERE op.profitability_id = $1`;
            dbParams.push(parseInt(profitabilityId));
        } else {
            sql += ` WHERE op.project_id = $1 AND op.profitability_id = (SELECT id FROM we_project_profitability WHERE project_id = $1 ORDER BY version DESC LIMIT 1)`;
            dbParams.push(projectId);
        }

        const result = await query(sql, dbParams);

        if (result.rows.length === 0) {
            // 수지분석서 정보는 가져와야 함
            const pResult = await query(`SELECT TO_CHAR(written_date, 'YYYY-MM-DD') as written_date, TO_CHAR(approved_date, 'YYYY-MM-DD') as approved_date FROM we_project_profitability WHERE project_id = $1 AND status IN ('STANDBY', 'IN_PROGRESS', 'COMPLETED') ORDER BY version DESC LIMIT 1`, [projectId]);
            const pRow = pResult.rows[0];

            return NextResponse.json({
                contractType: "",
                contractCategory: "",
                mainContract: "",
                mainOperator: "",
                executionLocation: "",
                overview: "",
                specialNotes: "",
                risk: "",
                paymentTerms: defaultPaymentTerms,
                partners: [],
                writtenDate: pRow?.written_date || "",
                approvedDate: pRow?.approved_date || ""
            });
        }

        const row = result.rows[0];
        return NextResponse.json({
            contractType: row.contract_type || "",
            contractCategory: row.contract_category || "",
            mainContract: row.main_contract || "",
            mainOperator: row.main_operator || "",
            executionLocation: row.execution_location || "",
            overview: row.overview || "",
            specialNotes: row.special_notes || "",
            risk: row.risk || "",
            paymentTerms: row.payment_terms || defaultPaymentTerms,
            partners: row.partners || [],
            writtenDate: row.written_date || "",
            approvedDate: row.approved_date || ""
        });
    } catch (error: any) {
        console.error("Error fetching order proposal:", error);
        return NextResponse.json(
            { error: "Failed to fetch data", message: error.message },
            { status: 500 }
        );
    }
}

// 수주품의 저장
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const body = await request.json();
        const {
            contractType,
            contractCategory,
            mainContract,
            mainOperator,
            executionLocation,
            overview,
            specialNotes,
            risk,
            paymentTerms,
            partners,
            writtenDate,
            approvedDate,
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
            const insRes = await query(`INSERT INTO we_project_profitability (project_id, version, status, created_by) VALUES ($1, $2, 'STANDBY', 1) RETURNING id`, [projectId, newV]);
            profitabilityId = insRes.rows[0].id;
        }

        // 1. 수주품의 테이블 저장 (profitability_id 기준)
        const sql = `
            INSERT INTO we_project_order_proposal (
                project_id, profitability_id, contract_type, contract_category, main_contract, main_operator,
                execution_location, overview, special_notes, risk, payment_terms, partners, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
            ON CONFLICT (profitability_id) DO UPDATE SET
                contract_type = EXCLUDED.contract_type,
                contract_category = EXCLUDED.contract_category,
                main_contract = EXCLUDED.main_contract,
                main_operator = EXCLUDED.main_operator,
                execution_location = EXCLUDED.execution_location,
                overview = EXCLUDED.overview,
                special_notes = EXCLUDED.special_notes,
                risk = EXCLUDED.risk,
                payment_terms = EXCLUDED.payment_terms,
                partners = EXCLUDED.partners,
                updated_at = CURRENT_TIMESTAMP
        `;
        await query(sql, [
            projectId, profitabilityId, contractType, contractCategory, mainContract, mainOperator,
            executionLocation, overview, specialNotes, risk, JSON.stringify(paymentTerms), JSON.stringify(partners)
        ]);

        // 2. 수지분석서 테이블에 날짜 및 요약 정보 저장
        if (profitabilityId) {
            await query(`
                UPDATE we_project_profitability 
                SET written_date = $2, 
                    approved_date = $3, 
                    total_revenue = $4,
                    total_cost = $5,
                    net_profit = $6,
                    profit_rate = $7,
                    status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [profitabilityId, writtenDate || null, approvedDate || null, totalRevenue || 0, totalCost || 0, netProfit || 0, profitRate || 0]);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving order proposal:", error);
        return NextResponse.json(
            { error: "Failed to save data", message: error.message },
            { status: 500 }
        );
    }
}
