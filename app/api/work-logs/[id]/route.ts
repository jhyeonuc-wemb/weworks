import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PUT: 작업일지 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const { id } = await params;
        const logId = parseInt(id);
        const body = await request.json();
        const {
            workDate,
            startTime,
            endTime,
            logType,
            category,
            subCategory,
            projectId,
            title,
            memo,
        } = body;

        // 업무시간 자동 계산
        let workHours: number | null = null;
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(":").map(Number);
            const [eh, em] = endTime.split(":").map(Number);
            const minutes = (eh * 60 + em) - (sh * 60 + sm);
            if (minutes > 0) {
                const lunchStart = 12 * 60;
                const lunchEnd = 13 * 60;
                const startMin = sh * 60 + sm;
                const endMin = eh * 60 + em;
                let lunchOverlap = 0;
                if (startMin < lunchEnd && endMin > lunchStart) {
                    lunchOverlap = Math.min(endMin, lunchEnd) - Math.max(startMin, lunchStart);
                }
                workHours = Math.round((minutes - lunchOverlap) / 60 * 10) / 10;
            }
        }

        // 본인 레코드만 수정 가능
        const result = await query(
            `UPDATE we_work_logs SET
        work_date = $1, start_time = $2, end_time = $3, work_hours = $4,
        log_type = $5, category = $6, sub_category = $7, project_id = $8, title = $9, memo = $10,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
            [
                workDate,
                startTime || null,
                endTime || null,
                workHours,
                logType || "actual",
                category || null,
                subCategory || null,
                projectId || null,
                title || null,
                memo || null,
                logId,
                user.id,
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
        }

        const row = result.rows[0];
        return NextResponse.json({
            success: true,
            item: {
                id: row.id,
                workDate: row.work_date
                    ? [row.work_date.getFullYear(), String(row.work_date.getMonth() + 1).padStart(2, '0'), String(row.work_date.getDate()).padStart(2, '0')].join('-')
                    : null,
                startTime: row.start_time,
                endTime: row.end_time,
                workHours: row.work_hours ? Number(row.work_hours) : null,
                logType: row.log_type,
                category: row.category,
                subCategory: row.sub_category,
                projectId: row.project_id,
                title: row.title,
                memo: row.memo,
            },
        });
    } catch (error: any) {
        console.error("Error updating work log:", error);
        return NextResponse.json(
            { error: "작업일지 수정에 실패했습니다.", details: error.message },
            { status: 500 }
        );
    }
}

// DELETE: 작업일지 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const { id } = await params;
        const logId = parseInt(id);

        const result = await query(
            `DELETE FROM we_work_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
            [logId, user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "레코드를 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting work log:", error);
        return NextResponse.json(
            { error: "작업일지 삭제에 실패했습니다.", details: error.message },
            { status: 500 }
        );
    }
}
