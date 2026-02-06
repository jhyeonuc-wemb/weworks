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

        const sql = `
            SELECT op.*, 
                   TO_CHAR(p.written_date, 'YYYY-MM-DD') as written_date, 
                   TO_CHAR(p.approved_date, 'YYYY-MM-DD') as approved_date 
            FROM we_project_order_proposal op
            LEFT JOIN we_project_profitability p ON op.project_id = p.project_id AND p.status IN ('not_started', 'in_progress', 'review', 'completed', 'approved')
            WHERE op.project_id = $1
            ORDER BY p.version DESC LIMIT 1
        `;
        const result = await query(sql, [projectId]);

        if (result.rows.length === 0) {
            // 수지분석서 정보는 가져와야 함
            const pResult = await query(`SELECT TO_CHAR(written_date, 'YYYY-MM-DD') as written_date, TO_CHAR(approved_date, 'YYYY-MM-DD') as approved_date FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress', 'review', 'completed', 'approved') ORDER BY version DESC LIMIT 1`, [projectId]);
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
            profitRate
        } = body;

        // 1. 수주품의 테이블 저장
        const sql = `
            INSERT INTO we_project_order_proposal (
                project_id, contract_type, contract_category, main_contract, main_operator,
                execution_location, overview, special_notes, risk, payment_terms, partners, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            ON CONFLICT (project_id) DO UPDATE SET
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
            projectId, contractType, contractCategory, mainContract, mainOperator,
            executionLocation, overview, specialNotes, risk, JSON.stringify(paymentTerms), JSON.stringify(partners)
        ]);

        // 2. 수지분석서 테이블에 날짜 및 요약 정보 저장
        await query(`
            UPDATE we_project_profitability 
            SET written_date = $2, 
                approved_date = $3, 
                total_revenue = $4,
                total_cost = $5,
                net_profit = $6,
                profit_rate = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (
                SELECT id FROM we_project_profitability 
                WHERE project_id = $1 AND status IN ('not_started', 'in_progress', 'review', 'completed', 'approved')
                ORDER BY version DESC LIMIT 1
            )
        `, [projectId, writtenDate || null, approvedDate || null, totalRevenue || 0, totalCost || 0, netProfit || 0, profitRate || 0]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error saving order proposal:", error);
        return NextResponse.json(
            { error: "Failed to save data", message: error.message },
            { status: 500 }
        );
    }
}
