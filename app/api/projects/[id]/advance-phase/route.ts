import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { advanceProjectPhase } from '@/lib/phase';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

/**
 * POST /api/projects/[id]/advance-phase
 * 현재 단계를 완료 처리하고 다음 단계로 자동 전환합니다.
 * Body: { currentPhaseCode: string }
 * 
 * advanceProjectPhase() 내부에서:
 *   1. 현재 단계의 마지막 상태(finalStatus)로 업데이트 (project_phase_statuses 동적 조회)
 *   2. we_projects.current_phase = 다음 단계
 *   3. 다음 단계를 첫 번째 상태로 초기화
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();
        const { currentPhaseCode, targetPhaseCode } = body;

        if (!currentPhaseCode) {
            return NextResponse.json(
                { error: 'currentPhaseCode is required' },
                { status: 400 }
            );
        }

        // advanceProjectPhase가 모든 처리를 담당:
        // - 현재 단계 마지막 상태로 완료 처리
        // - targetPhaseCode 지정 시 해당 단계로 직접 이동 (분기), 없으면 순차 이동
        // - we_projects.current_phase 갱신
        const nextPhaseCode = await advanceProjectPhase(projectId, currentPhaseCode, targetPhaseCode);

        return NextResponse.json({
            success: true,
            completedPhase: currentPhaseCode,
            nextPhaseCode,
        });
    } catch (error: any) {
        return handleApiError(error);
    }
}
