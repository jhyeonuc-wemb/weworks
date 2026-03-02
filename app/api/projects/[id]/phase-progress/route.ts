import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updatePhaseStatus, getPhaseStatuses } from '@/lib/phase';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

/**
 * PATCH /api/projects/[id]/phase-progress
 * 특정 단계의 상태를 업데이트합니다.
 * 
 * 두 가지 방식:
 * 1. action: "start" → 현재 단계의 두 번째 상태로 전환 (대기→진행 계열)
 * 2. status: "CODE"  → 지정한 상태 코드로 직접 전환 (project_phase_statuses 기반)
 * 
 * Body: { phaseCode: string, action?: "start", status?: string }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = getCurrentUser(request);
        if (!user) throw new UnauthorizedError('인증이 필요합니다.');

        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();
        const { phaseCode, action, status } = body;

        if (!phaseCode) {
            return NextResponse.json({ error: 'phaseCode is required' }, { status: 400 });
        }

        let targetStatus: string;

        if (action === 'start') {
            // 이 단계의 두 번째 상태로 전환 (초기→진행 중 계열)
            const statuses = await getPhaseStatuses(phaseCode);
            if (statuses.length < 2) {
                // 상태가 1개뿐이면 마지막 상태로 전환
                targetStatus = statuses[0]?.code;
            } else {
                targetStatus = statuses[1].code; // 두 번째 상태
            }
        } else if (status) {
            // 직접 지정 (project_phase_statuses에 정의된 코드여야 함)
            const validStatuses = await getPhaseStatuses(phaseCode);
            const validCodes = validStatuses.map(s => s.code);
            if (!validCodes.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status '${status}' for phase '${phaseCode}'. Valid: ${validCodes.join(', ')}` },
                    { status: 400 }
                );
            }
            targetStatus = status;
        } else {
            return NextResponse.json(
                { error: 'Either action:"start" or status is required' },
                { status: 400 }
            );
        }

        await updatePhaseStatus(projectId, phaseCode, targetStatus);

        return NextResponse.json({ success: true, projectId, phaseCode, status: targetStatus });
    } catch (error: any) {
        return handleApiError(error);
    }
}
