import { NextRequest, NextResponse } from 'next/server';
import { getProjectPhaseProgress } from '@/lib/phase';

// 프로젝트의 전체 단계별 진행 상태 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const phases = await getProjectPhaseProgress(projectId);

        // 현재 단계 계산: STANDBY가 아닌 마지막 단계, 또는 첫번째 단계
        const currentPhase = phases.find(p => p.status === 'IN_PROGRESS')
            || phases.find(p => p.status === 'STANDBY')
            || phases[phases.length - 1];

        return NextResponse.json({
            phases: phases.map(p => ({
                code: p.code,
                name: p.name,
                displayOrder: p.display_order,
                phaseGroup: p.phase_group,
                path: p.path,
                status: p.status,          // STANDBY | IN_PROGRESS | COMPLETED
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
