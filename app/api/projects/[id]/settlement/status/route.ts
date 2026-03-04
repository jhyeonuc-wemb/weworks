import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { updatePhaseStatus, advanceProjectPhase } from "@/lib/phase";

// 수지정산서 상태 변경
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectIdStr } = await params;
        const projectId = parseInt(projectIdStr);
        const body = await request.json();
        const { status } = body;

        if (!projectId || !status) {
            return NextResponse.json(
                { error: "Project ID and status are required" },
                { status: 400 }
            );
        }

        const sql = `
            UPDATE we_project_settlement
            SET status = $2, updated_at = CURRENT_TIMESTAMP
            WHERE project_id = $1
            RETURNING id, status
        `;

        const result = await query(sql, [projectId, status]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Settlement record not found for this project" },
                { status: 404 }
            );
        }

        // phase_progress 상태 업데이트
        if (status === 'IN_PROGRESS') {
            await query(
                `UPDATE we_project_phase_progress
                 SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
                 WHERE project_id = $1 AND phase_code = 'settlement' AND status = 'STANDBY'`,
                [projectId]
            );
        }

        // 수지정산서 완료 시 phase_progress 업데이트 + 다음 단계 자동 이동
        // advanceProjectPhase가 마지막 단계라면 status='completed'로 처리함
        if (status === 'COMPLETED') {
            await updatePhaseStatus(projectId, 'settlement', 'COMPLETED');
            await advanceProjectPhase(projectId, 'settlement');
        }

        return NextResponse.json({
            success: true,
            settlement: result.rows[0],
        });
    } catch (error: any) {
        console.error("Error updating settlement status:", error);
        return NextResponse.json(
            { error: "Failed to update status", message: error.message },
            { status: 500 }
        );
    }
}
