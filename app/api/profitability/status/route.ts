import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

        // 수지분석서가 완료되면 프로젝트 단계를 'settlement'로 변경
        if (status === 'COMPLETED') {
            try {
                console.log(`Updating project ${projectId} phase to project_in_progress`);
                const updateRes = await query(
                    "UPDATE we_projects SET current_phase = 'project_in_progress', status = 'project_in_progress' WHERE id = $1",
                    [projectId]
                );
                console.log(`Project phase update result: ${updateRes.rowCount}`);
            } catch (err) {
                console.error(`Failed to update project phase for ${projectId}:`, err);
            }
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
