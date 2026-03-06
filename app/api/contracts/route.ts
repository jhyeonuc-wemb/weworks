import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

/**
 * GET /api/contracts
 * - ?projectId=X : 특정 프로젝트의 계약 목록 (we_contracts 기반)
 * - 파라미터 없음 : 계약 현황 전체 목록 (current_phase='contract' 프로젝트 기반)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        // ── 프로젝트별 계약 목록 ──────────────────────────────────────────────
        if (projectId) {
            const result = await pool.query(
                `SELECT
                    c.id,
                    c.project_id,
                    c.contract_title,
                    c.contract_type,
                    c.supply_amount,
                    c.contract_date::text          AS contract_date,
                    c.contract_start_date::text    AS contract_start_date,
                    c.contract_end_date::text      AS contract_end_date,
                    c.created_at,
                    c.updated_at
                FROM we_contracts c
                WHERE c.project_id = $1
                ORDER BY c.created_at ASC`,
                [parseInt(projectId)]
            );

            return NextResponse.json({
                contracts: result.rows.map((r: any) => ({
                    id: r.id,
                    projectId: r.project_id,
                    contractTitle: r.contract_title || null,
                    contractType: r.contract_type || null,
                    supplyAmount: r.supply_amount ? Number(r.supply_amount) : null,
                    contractDate: r.contract_date ? String(r.contract_date).slice(0, 10) : null,
                    contractStartDate: r.contract_start_date ? String(r.contract_start_date).slice(0, 10) : null,
                    contractEndDate: r.contract_end_date ? String(r.contract_end_date).slice(0, 10) : null,
                    createdAt: r.created_at,
                })),
            });
        }

        // ── 전체 계약 현황 목록 ────────────────────────────────────────────────
        const search = searchParams.get('search') || '';
        const year = searchParams.get('year') || '';
        const statusCode = searchParams.get('status') || '';

        // VRB/수지분석서와 동일 패턴:
        // we_project_phase_progress.phase_code = 'contract', status != 'STANDBY'

        let query = `
            SELECT
                p.id,
                p.project_code,
                p.name,
                p.expected_amount,
                p.current_phase,
                c.name AS customer_name,
                o.name AS orderer_name,
                u.name AS manager_name,
                COALESCE(pp.status, 'STANDBY') AS contract_status,
                pp.started_at,
                pp.completed_at,
                (SELECT COUNT(*) FROM we_contracts wc WHERE wc.project_id = p.id) AS contract_count,
                (SELECT MAX(wc.contract_start_date) FROM we_contracts wc WHERE wc.project_id = p.id) AS contract_start_date,
                (SELECT MAX(wc.contract_end_date)   FROM we_contracts wc WHERE wc.project_id = p.id) AS contract_end_date
            FROM we_projects p
            LEFT JOIN we_clients c ON p.customer_id = c.id
            LEFT JOIN we_clients o ON p.orderer_id = o.id
            LEFT JOIN we_users   u ON p.manager_id = u.id
            LEFT JOIN we_project_phase_progress pp
                   ON pp.project_id = p.id AND pp.phase_code = 'contract'
            WHERE COALESCE(pp.status, 'STANDBY') != 'STANDBY'
        `;

        const params: any[] = [];
        let paramIdx = 1;

        if (search) {
            query += ` AND (p.name ILIKE $${paramIdx} OR p.project_code ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }
        if (year) {
            query += ` AND p.project_code LIKE $${paramIdx}`;
            const shortYear = year.slice(2);
            params.push(`P${shortYear}-%`);
            paramIdx++;
        }
        if (statusCode) {
            query += ` AND COALESCE(pp.status, 'STANDBY') = $${paramIdx}`;
            params.push(statusCode);
            paramIdx++;
        }

        query += ` ORDER BY p.project_code DESC NULLS LAST`;

        const result = await pool.query(query, params);

        const contracts = result.rows.map((row: any) => ({
            id: row.id,
            projectCode: row.project_code,
            name: row.name,
            customerName: row.customer_name || null,
            ordererName: row.orderer_name || null,
            managerName: row.manager_name || null,
            contractStartDate: row.contract_start_date ? new Date(row.contract_start_date).toISOString().slice(0, 10) : null,
            contractEndDate: row.contract_end_date ? new Date(row.contract_end_date).toISOString().slice(0, 10) : null,
            expectedAmount: row.expected_amount ? Number(row.expected_amount) : null,
            currentPhase: row.current_phase,
            contractStatus: row.contract_status,
            contractCount: Number(row.contract_count),
            startedAt: row.started_at,
            completedAt: row.completed_at,
        }));

        return NextResponse.json({
            contracts,
            meta: {
                total: contracts.length,
            }
        });
    } catch (error: any) {
        return handleApiError(error);
    }
}

/**
 * POST /api/contracts
 * 계약 신규 등록 (we_contracts INSERT)
 */
export async function POST(request: NextRequest) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const body = await request.json();
        const {
            projectId, contractTitle, supplyAmount, stampDuty,
            performanceBondRate, defectBondRate, paymentSchedule,
            contractNotes, contractDate, contractStartDate, contractEndDate,
            expectedAmount,
        } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'projectId는 필수입니다.' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO we_contracts (
                project_id, contract_title, supply_amount, stamp_duty,
                performance_bond_rate, defect_bond_rate, payment_schedule,
                contract_notes, contract_date, contract_start_date, contract_end_date
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id`,
            [
                projectId,
                contractTitle || null,
                supplyAmount || null,
                stampDuty || null,
                performanceBondRate ?? 10,
                defectBondRate ?? 2,
                paymentSchedule || null,
                contractNotes || null,
                contractDate || null,
                contractStartDate || null,
                contractEndDate || null,
            ]
        );

        const finalExpected = expectedAmount ?? (supplyAmount ? Math.round(supplyAmount * 1.1) : null);
        if (finalExpected) {
            await pool.query(
                `UPDATE we_projects SET expected_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [finalExpected, projectId]
            );
        }

        return NextResponse.json({ success: true, id: result.rows[0].id });
    } catch (error: any) {
        return handleApiError(error);
    }
}
