import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { updatePhaseStatus, advanceProjectPhase } from "@/lib/phase";

// 수지분석서 상태 변경
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, status } = body;

        if (!projectId || !status) {
            return NextResponse.json(
                { error: "Project ID and status are required" },
                { status: 400 }
            );
        }

        const sql = `
      UPDATE we_project_profitability
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id FROM we_project_profitability
        WHERE project_id = $1 AND status IN ('STANDBY', 'IN_PROGRESS')
        ORDER BY version DESC
        LIMIT 1
      )
      RETURNING id, status
    `;

        const result = await query(sql, [projectId, status]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Active profitability record not found for this project" },
                { status: 404 }
            );
        }

        // phase_progress 상태 업데이트
        if (status === 'IN_PROGRESS') {
            await query(
                `UPDATE we_project_phase_progress
                 SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
                 WHERE project_id = $1 AND phase_code = 'profitability' AND status = 'STANDBY'`,
                [projectId]
            );
        }

        // 수지분석서 완료 시 phase_progress 업데이트 + 다음 단계 자동 이동
        if (status === 'COMPLETED') {
            await updatePhaseStatus(projectId, 'profitability', 'COMPLETED');
            await advanceProjectPhase(projectId, 'profitability');
        }

        return NextResponse.json({
            success: true,
            profitability: result.rows[0],
        });
    } catch (error: any) {
        console.error("Error updating profitability status:", error);
        return NextResponse.json(
            { error: "Failed to update status", message: error.message },
            { status: 500 }
        );
    }
}
