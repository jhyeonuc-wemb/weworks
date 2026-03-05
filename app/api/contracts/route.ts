import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { handleApiError } from '@/lib/core/errors';

/**
 * GET /api/contracts
 * 계약 현황 목록 조회
 * - current_phase = 'contract' 인 프로젝트
 * - we_project_phase_progress 에서 계약 단계 상태 읽기 (단일 소스)
 * - project_phase_statuses 에서 initialStatus/finalStatus 파악
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const year = searchParams.get('year') || '';
        const statusCode = searchParams.get('status') || '';

        // 계약 단계 상태 정의 조회 (initialStatus/finalStatus 판단용)
        const phaseStatusDefs = await pool.query(
            `SELECT pps.code, pps.name, pps.color, pps.display_order
             FROM project_phase_statuses pps
             JOIN project_phases pp ON pp.id = pps.phase_id
             WHERE pp.code = 'contract' AND pps.is_active = true
             ORDER BY pps.display_order ASC`
        );
        const statusDefs = phaseStatusDefs.rows;
        const initialStatus = statusDefs[0]?.code || 'STANDBY';
        const finalStatus = statusDefs[statusDefs.length - 1]?.code || 'COMPLETED';

        // 계약 현황 목록 조회
        // current_phase = 'contract' 인 프로젝트 + phase_progress에서 계약 상태 읽기
        let query = `
            SELECT
                p.id,
                p.project_code,
                p.name,
                p.contract_start_date,
                p.contract_end_date,
                p.expected_amount,
                p.current_phase,
                c.name AS customer_name,
                o.name AS orderer_name,
                u.name AS manager_name,
                -- 계약 단계 phase_progress 상태 (단일 소스)
                COALESCE(pp_prog.status_code, $1) AS contract_status,
                pp_prog.started_at,
                pp_prog.completed_at
            FROM we_projects p
            LEFT JOIN we_clients c ON p.customer_id = c.id
            LEFT JOIN we_clients o ON p.orderer_id = o.id
            LEFT JOIN we_users u ON p.manager_id = u.id
            LEFT JOIN (
                SELECT
                    ppp.project_id,
                    pps.code AS status_code,
                    ppp.started_at,
                    ppp.completed_at
                FROM we_project_phase_progress ppp
                JOIN project_phase_statuses pps ON pps.id = ppp.status_id
                JOIN project_phases ph ON ph.id = pps.phase_id
                WHERE ph.code = 'contract'
            ) pp_prog ON pp_prog.project_id = p.id
            WHERE p.current_phase = 'contract'
        `;

        const params: any[] = [initialStatus];
        let paramIdx = 2;

        if (search) {
            query += ` AND (p.name ILIKE $${paramIdx} OR p.project_code ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        if (year) {
            query += ` AND p.project_code LIKE $${paramIdx}`;
            // project_code 형식: P25-xxx
            const shortYear = year.slice(2); // "2025" → "25"
            params.push(`P${shortYear}-%`);
            paramIdx++;
        }

        if (statusCode) {
            query += ` AND COALESCE(pp_prog.status_code, $1) = $${paramIdx}`;
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
            contractStartDate: row.contract_start_date
                ? new Date(row.contract_start_date).toISOString().slice(0, 10)
                : null,
            contractEndDate: row.contract_end_date
                ? new Date(row.contract_end_date).toISOString().slice(0, 10)
                : null,
            expectedAmount: row.expected_amount ? Number(row.expected_amount) : null,
            currentPhase: row.current_phase,
            contractStatus: row.contract_status,
            startedAt: row.started_at,
            completedAt: row.completed_at,
        }));

        return NextResponse.json({
            contracts,
            meta: {
                total: contracts.length,
                statusDefs: statusDefs.map((s: any) => ({ code: s.code, name: s.name, color: s.color })),
                initialStatus,
                finalStatus,
            }
        });
    } catch (error: any) {
        return handleApiError(error);
    }
}
