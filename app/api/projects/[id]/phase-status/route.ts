import { NextRequest, NextResponse } from 'next/server';
import { getProjectPhaseProgress } from '@/lib/phase';

// 프로젝트의 전체 단계별 진행 상태 조회 (그룹 정보 + 단계별 초기/마지막 상태 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const phases = await getProjectPhaseProgress(projectId);

        // 현재 단계 계산:
        // - 진행 중인 단계(초기 상태도 아니고 마지막 상태도 아닌, 또는 마지막 아닌 상태) 우선
        // - 없으면 첫 번째로 시작 안 된 단계
        // - 없으면 마지막 단계
        const currentPhase =
            phases.find(p => p.status !== p.initial_status && p.status !== p.final_status) // IN_PROGRESS 계열
            || phases.find(p => p.status === p.initial_status) // 아직 시작 안 한 단계
            || phases[phases.length - 1];

        return NextResponse.json({
            phases: phases.map(p => ({
                code: p.code,
                name: p.name,
                displayOrder: p.display_order,
                phaseGroup: p.phase_group,
                groupName: p.group_name || p.phase_group,
                groupColor: p.group_color || null,
                path: p.path,
                status: p.status,              // 현재 상태 코드 (project_phase_statuses 기반)
                initialStatus: p.initial_status, // 이 단계의 첫 번째 상태 코드
                finalStatus: p.final_status,     // 이 단계의 마지막 상태 코드 (= 완료)
                startedAt: p.started_at,
                completedAt: p.completed_at,
            })),
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
