import { NextRequest, NextResponse } from 'next/server';
import { getProjectPhaseProgress } from '@/lib/phase';
import { query } from '@/lib/db';

// 날짜 포맷 (YYYY-MM-DD)
function fmt(d: string | Date | null | undefined): string | null {
    if (!d) return null;
    const s = typeof d === 'string' ? d : d.toISOString();
    return s.slice(0, 10);
}

// 프로젝트의 전체 단계별 진행 상태 조회 (그룹 정보 + 단계별 초기/마지막 상태 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const phases = await getProjectPhaseProgress(projectId);

        // ── 단계별 도메인 날짜 한 번에 조회 ──────────────────────────────
        const dateRes = await query(
            `SELECT
               p.contract_start_date,
               p.contract_end_date,
               p.actual_start_date,
               p.actual_end_date,
               -- 수지분석서 최신 버전
               (SELECT TO_CHAR(written_date, 'YYYY-MM-DD')
                FROM we_project_profitability
                WHERE project_id = $1 ORDER BY version DESC LIMIT 1) AS prof_written_date,
               (SELECT TO_CHAR(approved_date, 'YYYY-MM-DD')
                FROM we_project_profitability
                WHERE project_id = $1 ORDER BY version DESC LIMIT 1) AS prof_approved_date,
               -- 수지정산서 (settlement_date = 기안일)
               (SELECT TO_CHAR(settlement_date, 'YYYY-MM-DD')
                FROM we_project_settlement
                WHERE project_id = $1 LIMIT 1) AS settle_written_date,
               (SELECT TO_CHAR(approved_date, 'YYYY-MM-DD')
                FROM we_project_settlement
                WHERE project_id = $1 LIMIT 1) AS settle_approved_date
             FROM we_projects p WHERE p.id = $1`,
            [projectId]
        );
        const d = dateRes.rows[0] || {};

        // ── 단계 코드 → 날짜 매핑 정의 ──────────────────────────────────
        const phaseDateMap: Record<string, { date1Label: string; date1: string | null; date2Label: string; date2: string | null }> = {
            vrb: {
                date1Label: '기안일', date1: null,   // phase_progress.started_at 에서 채움
                date2Label: '승인일', date2: null,   // phase_progress.completed_at 에서 채움
            },
            contract: {
                date1Label: '시작일', date1: fmt(d.contract_start_date),
                date2Label: '종료일', date2: fmt(d.contract_end_date),
            },
            profitability: {
                date1Label: '기안일', date1: d.prof_written_date || null,
                date2Label: '승인일', date2: d.prof_approved_date || null,
            },
            in_progress: {
                date1Label: '시작일', date1: fmt(d.actual_start_date),
                date2Label: '종료일', date2: fmt(d.actual_end_date),
            },
            settlement: {
                date1Label: '기안일', date1: d.settle_written_date || null,
                date2Label: '승인일', date2: d.settle_approved_date || null,
            },
        };

        // 현재 단계 계산
        const currentPhase =
            phases.find(p => p.status !== p.initial_status && p.status !== p.final_status)
            || phases.find(p => p.status === p.initial_status)
            || phases[phases.length - 1];

        return NextResponse.json({
            phases: phases.map(p => {
                const dates = phaseDateMap[p.code] || null;
                // VRB는 phase_progress 날짜 사용
                if (p.code === 'vrb' && dates) {
                    dates.date1 = fmt(p.started_at);
                    dates.date2 = fmt(p.completed_at);
                }
                return {
                    code: p.code,
                    name: p.name,
                    displayOrder: p.display_order,
                    phaseGroup: p.phase_group,
                    groupName: p.group_name || p.phase_group,
                    groupColor: p.group_color || null,
                    path: p.path,
                    status: p.status,
                    initialStatus: p.initial_status,
                    finalStatus: p.final_status,
                    startedAt: p.started_at,
                    completedAt: p.completed_at,
                    ...(dates || {}),
                };
            }),
            currentPhaseCode: currentPhase?.code || null,
        });
    } catch (error: any) {
        console.error('Error fetching phase progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch phase progress', message: error.message },
            { status: 500 }
        );
    }
}
