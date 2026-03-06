import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

/**
 * GET /api/contracts/[id]
 * 계약 단건 상세 조회 (we_contracts.id 기준)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contractId = parseInt(id);

        const result = await pool.query(
            `SELECT
                c.id            AS contract_id,
                c.project_id,
                c.contract_title,
                c.contract_type,
                c.supply_amount,
                c.stamp_duty,
                c.performance_bond_rate,
                c.defect_bond_rate,
                c.payment_schedule,
                c.contract_notes,
                c.contract_date::text          AS contract_date,
                c.contract_start_date::text    AS contract_start_date,
                c.contract_end_date::text      AS contract_end_date,
                c.created_at,
                c.updated_at,
                p.project_code,
                p.name          AS project_name,
                p.expected_amount,
                p.current_phase,
                pc.id           AS customer_id,
                COALESCE(c.customer_name,  pc.name)  AS customer_name,
                pc.code         AS customer_code,
                po.id           AS orderer_id,
                COALESCE(c.orderer_name,   po.name)  AS orderer_name,
                po.code         AS orderer_code,
                u_m.id          AS manager_id,
                CASE
                    WHEN c.manager_name IS NOT NULL THEN c.manager_name
                    ELSE TRIM(CONCAT_WS(' ', u_m.name, r_m.name))
                END             AS manager_name,
                NULL::text      AS manager_rank_name,
                d_m.name        AS manager_dept_name,
                u_s.id          AS sales_rep_id,
                CASE
                    WHEN c.sales_rep_name IS NOT NULL THEN c.sales_rep_name
                    ELSE TRIM(CONCAT_WS(' ', u_s.name, r_s.name))
                END             AS sales_rep_name,
                NULL::text      AS sales_rep_rank_name,
                d_s.name        AS sales_rep_dept_name
            FROM we_contracts c
            JOIN we_projects p ON p.id = c.project_id
            LEFT JOIN we_clients pc ON p.customer_id = pc.id
            LEFT JOIN we_clients po ON p.orderer_id = po.id
            LEFT JOIN we_users u_m ON p.manager_id = u_m.id
            LEFT JOIN we_codes r_m ON u_m.rank_id = r_m.id
            LEFT JOIN we_departments d_m ON u_m.department_id = d_m.id
            LEFT JOIN we_users u_s ON p.sales_representative_id = u_s.id
            LEFT JOIN we_codes r_s ON u_s.rank_id = r_s.id
            LEFT JOIN we_departments d_s ON u_s.department_id = d_s.id
            WHERE c.id = $1`,
            [contractId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: '계약 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const row = result.rows[0];
        let durationDays: number | null = null;
        if (row.contract_start_date && row.contract_end_date) {
            const s = new Date(String(row.contract_start_date).slice(0, 10));
            const e = new Date(String(row.contract_end_date).slice(0, 10));
            durationDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        return NextResponse.json({
            contract: {
                id: row.contract_id,
                projectId: row.project_id,
                contractTitle: row.contract_title || null,
                projectCode: row.project_code,
                projectName: row.project_name,
                expectedAmount: row.expected_amount ? Number(row.expected_amount) : null,
                supplyAmount: row.supply_amount ? Number(row.supply_amount) : null,
                stampDuty: row.stamp_duty ? Number(row.stamp_duty) : null,
                performanceBondRate: row.performance_bond_rate ? Number(row.performance_bond_rate) : 10,
                defectBondRate: row.defect_bond_rate ? Number(row.defect_bond_rate) : 2,
                paymentSchedule: row.payment_schedule || '',
                contractNotes: row.contract_notes || '',
                contractDate: row.contract_date ? String(row.contract_date).slice(0, 10) : null,
                contractStartDate: row.contract_start_date ? String(row.contract_start_date).slice(0, 10) : null,
                contractEndDate: row.contract_end_date ? String(row.contract_end_date).slice(0, 10) : null,
                durationDays,
                currentPhase: row.current_phase,
                customerId: row.customer_id,
                customerName: row.customer_name || null,
                customerCode: row.customer_code || null,
                ordererId: row.orderer_id,
                ordererName: row.orderer_name || null,
                ordererCode: row.orderer_code || null,
                managerId: row.manager_id,
                managerName: row.manager_name || null,
                managerRankName: row.manager_rank_name || null,
                managerDeptName: row.manager_dept_name || null,
                salesRepId: row.sales_rep_id,
                salesRepName: row.sales_rep_name || null,
                salesRepRankName: row.sales_rep_rank_name || null,
                salesRepDeptName: row.sales_rep_dept_name || null,
                contractType: row.contract_type || '신규',
            }
        });
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * PUT /api/contracts/[id]
 * 계약 수정 (we_contracts.id 기준)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const { id } = await params;
        const contractId = parseInt(id);
        const body = await request.json();

        const {
            contractTitle,
            contractType,
            ordererName,
            customerName,
            managerName,
            salesRepName,
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

        const result = await pool.query(
            `UPDATE we_contracts SET
                contract_title        = $1,
                contract_type         = $2,
                orderer_name          = $3,
                customer_name         = $4,
                manager_name          = $5,
                sales_rep_name        = $6,
                supply_amount         = $7,
                stamp_duty            = $8,
                performance_bond_rate = $9,
                defect_bond_rate      = $10,
                payment_schedule      = $11,
                contract_notes        = $12,
                contract_date         = $13,
                contract_start_date   = $14,
                contract_end_date     = $15,
                updated_at            = CURRENT_TIMESTAMP
            WHERE id = $16
            RETURNING id, project_id`,
            [
                contractTitle || null,
                contractType || '신규',
                ordererName || null,
                customerName || null,
                managerName || null,
                salesRepName || null,
                supplyAmount || null,
                stampDuty || null,
                performanceBondRate ?? 10,
                defectBondRate ?? 2,
                paymentSchedule || null,
                contractNotes || null,
                contractDate || null,
                contractStartDate || null,
                contractEndDate || null,
                contractId,
            ]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: '계약을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 프로젝트의 expected_amount도 동기화 (공급가액 기준 부가세 포함)
        const projectId = result.rows[0].project_id;
        const finalExpected = expectedAmount ?? (supplyAmount ? Math.round(supplyAmount * 1.1) : null);
        if (finalExpected) {
            await pool.query(
                `UPDATE we_projects SET expected_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [finalExpected, projectId]
            );
        }

        return NextResponse.json({ success: true, id: contractId });
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/contracts/[id]
 * 계약 삭제 (we_contracts.id 기준)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const { id } = await params;
        const contractId = parseInt(id);

        const result = await pool.query(
            `DELETE FROM we_contracts WHERE id = $1 RETURNING id`,
            [contractId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: '계약을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return handleApiError(error);
    }
}
