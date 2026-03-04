import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET: 작업일지 목록 조회
export async function GET(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId") ? Number(searchParams.get("userId")) : Number(user.id);
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const logType = searchParams.get("logType"); // plan | actual

        const params: any[] = [userId];
        let sql = `
      SELECT 
        w.id, w.user_id, w.work_date, 
        w.start_time, w.end_time, w.work_hours,
        w.log_type, w.category, w.sub_category, w.project_id,
        w.title, w.memo, w.created_at, w.updated_at,
        u.name as user_name,
        p.name as project_name
      FROM we_work_logs w
      LEFT JOIN we_users u ON u.id = w.user_id
      LEFT JOIN we_projects p ON p.id = w.project_id
      WHERE w.user_id = $1
    `;

        if (dateFrom) {
            params.push(dateFrom);
            sql += ` AND w.work_date >= $${params.length}`;
        }
        if (dateTo) {
            params.push(dateTo);
            sql += ` AND w.work_date <= $${params.length}`;
        }
        if (logType) {
            params.push(logType);
            sql += ` AND w.log_type = $${params.length}`;
        }

        sql += ` ORDER BY w.work_date ASC, w.start_time ASC`;

        const result = await query(sql, params);

        const items = result.rows.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
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
            projectName: row.project_name,
            title: row.title,
            memo: row.memo,
        }));

        return NextResponse.json({ items });
    } catch (error: any) {
        console.error("Error fetching work logs:", error);
        return NextResponse.json(
            { error: "작업일지 조회에 실패했습니다.", details: error.message },
            { status: 500 }
        );
    }
}

// POST: 작업일지 생성
export async function POST(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            workDate,
            startTime,
            endTime,
            logType = "actual",
            category,
            subCategory,
            projectId,
            title,
            memo,
        } = body;

        if (!workDate) {
            return NextResponse.json({ error: "날짜는 필수입니다." }, { status: 400 });
        }

        // 업무시간 자동 계산
        let workHours: number | null = null;
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(":").map(Number);
            const [eh, em] = endTime.split(":").map(Number);
            const minutes = (eh * 60 + em) - (sh * 60 + sm);
            if (minutes > 0) {
                // 점심시간(1시간) 제외: 시작~12시, 13시~종료
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

        const result = await query(
            `INSERT INTO we_work_logs 
        (user_id, work_date, start_time, end_time, work_hours, log_type, category, sub_category, project_id, title, memo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [
                user.id,
                workDate,
                startTime || null,
                endTime || null,
                workHours,
                logType,
                category || null,
                subCategory || null,
                projectId || null,
                title || null,
                memo || null,
            ]
        );

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
        console.error("Error creating work log:", error);
        return NextResponse.json(
            { error: "작업일지 생성에 실패했습니다.", details: error.message },
            { status: 500 }
        );
    }
}
