import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

/**
 * GET /api/contracts/[id]
 * 계약 상세 조회 (project_id 기준)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const result = await pool.query(
            `SELECT
                p.id,
                p.project_code,
                p.name,
                p.expected_amount,
                p.supply_amount,
                p.stamp_duty,
                p.performance_bond_rate,
                p.defect_bond_rate,
                p.payment_schedule,
                p.contract_notes,
                p.contract_date,
                p.contract_start_date,
                p.contract_end_date,
                p.current_phase,
                c.id   AS customer_id,
                c.name AS customer_name,
                c.code AS customer_code,
                o.id   AS orderer_id,
                o.name AS orderer_name,
                o.code AS orderer_code,
                u_m.id   AS manager_id,
                u_m.name AS manager_name,
                r_m.name AS manager_rank_name,
                d_m.name AS manager_dept_name,
                u_s.id   AS sales_rep_id,
                u_s.name AS sales_rep_name,
                r_s.name AS sales_rep_rank_name,
                d_s.name AS sales_rep_dept_name
            FROM we_projects p
            LEFT JOIN we_clients c ON p.customer_id = c.id
            LEFT JOIN we_clients o ON p.orderer_id = o.id
            LEFT JOIN we_users u_m ON p.manager_id = u_m.id
            LEFT JOIN we_codes r_m ON u_m.rank_id = r_m.id
            LEFT JOIN we_departments d_m ON u_m.department_id = d_m.id
            LEFT JOIN we_users u_s ON p.sales_representative_id = u_s.id
            LEFT JOIN we_codes r_s ON u_s.rank_id = r_s.id
            LEFT JOIN we_departments d_s ON u_s.department_id = d_s.id
            WHERE p.id = $1`,
            [projectId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: '계약 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const row = result.rows[0];

        // 계약 기간 일수 계산
        let durationDays: number | null = null;
        if (row.contract_start_date && row.contract_end_date) {
            const start = new Date(row.contract_start_date);
            const end = new Date(row.contract_end_date);
            durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        return NextResponse.json({
            contract: {
                id: row.id,
                projectCode: row.project_code,
                name: row.name,
                // 금액
                expectedAmount: row.expected_amount ? Number(row.expected_amount) : null,
                supplyAmount: row.supply_amount ? Number(row.supply_amount) : null,
                stampDuty: row.stamp_duty ? Number(row.stamp_duty) : null,
                performanceBondRate: row.performance_bond_rate ? Number(row.performance_bond_rate) : 10,
                defectBondRate: row.defect_bond_rate ? Number(row.defect_bond_rate) : 2,
                paymentSchedule: row.payment_schedule || '',
                contractNotes: row.contract_notes || '',
                // 날짜
                contractDate: row.contract_date
                    ? new Date(row.contract_date).toISOString().slice(0, 10) : null,
                contractStartDate: row.contract_start_date
                    ? new Date(row.contract_start_date).toISOString().slice(0, 10) : null,
                contractEndDate: row.contract_end_date
                    ? new Date(row.contract_end_date).toISOString().slice(0, 10) : null,
                durationDays,
                currentPhase: row.current_phase,
                // 거래처
                customerId: row.customer_id,
                customerName: row.customer_name || null,
                customerCode: row.customer_code || null,
                ordererId: row.orderer_id,
                ordererName: row.orderer_name || null,
                ordererCode: row.orderer_code || null,
                // 담당자
                managerId: row.manager_id,
                managerName: row.manager_name || null,
                managerRankName: row.manager_rank_name || null,
                managerDeptName: row.manager_dept_name || null,
                salesRepId: row.sales_rep_id,
                salesRepName: row.sales_rep_name || null,
                salesRepRankName: row.sales_rep_rank_name || null,
                salesRepDeptName: row.sales_rep_dept_name || null,
            }
        });
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * PUT /api/contracts/[id]
 * 계약 정보 저장 (project_id 기준)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();

        const {
            supplyAmount,
            stampDuty,
            performanceBondRate,
            defectBondRate,
            paymentSchedule,
            contractNotes,
            contractDate,
            contractStartDate,
            contractEndDate,
            expectedAmount,
        } = body;

        // expected_amount: supply_amount + tax(10%)
        const finalExpected = expectedAmount ?? (supplyAmount ? Math.round(supplyAmount * 1.1) : null);

        const result = await pool.query(
            `UPDATE we_projects SET
                expected_amount      = COALESCE($1, expected_amount),
                supply_amount        = $2,
                stamp_duty           = $3,
                performance_bond_rate = $4,
                defect_bond_rate      = $5,
                payment_schedule     = $6,
                contract_notes       = $7,
                contract_date        = $8,
                contract_start_date  = COALESCE($9, contract_start_date),
                contract_end_date    = COALESCE($10, contract_end_date),
                updated_at           = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING id`,
            [
                finalExpected,
                supplyAmount || null,
                stampDuty || null,
                performanceBondRate ?? 10,
                defectBondRate ?? 2,
                paymentSchedule || null,
                contractNotes || null,
                contractDate || null,
                contractStartDate || null,
                contractEndDate || null,
                projectId,
            ]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: projectId });
    } catch (error: any) {
        return handleApiError(error);
    }
}
