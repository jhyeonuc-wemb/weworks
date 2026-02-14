import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

        // 수지정산서가 완료되면 프로젝트 상태를 'completed'로 변경
        if (status === 'COMPLETED') {
            try {
                console.log(`Settlement COMPLETED via status API. Updating project ${projectId} status to completed`);
                await query(
                    "UPDATE we_projects SET status = 'completed', current_phase = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                    [projectId]
                );
            } catch (err) {
                console.error(`Failed to update project status for ${projectId}:`, err);
            }
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
