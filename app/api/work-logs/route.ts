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
        const logType = searchParams.get("logType");

        const params: any[] = [userId];
        let sql = `
      SELECT 
        w.id, w.user_id, w.work_date, 
        w.start_time, w.end_time, w.work_hours,
        w.log_type, w.category, w.sub_category, w.project_id,
        w.title, w.memo, w.created_at, w.updated_at,
        u.name as user_name,
        p.name as project_name,
        c.name as category_name,
        sc.name as sub_category_name
      FROM we_work_logs w
      LEFT JOIN we_users u ON u.id = w.user_id
      LEFT JOIN we_projects p ON p.id = w.project_id
      LEFT JOIN we_codes c ON c.code = w.category
      LEFT JOIN we_codes sc ON sc.code = w.sub_category
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
            categoryName: row.category_name,
            subCategory: row.sub_category,
            subCategoryName: row.sub_category_name,
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

        // ── 마감일 체크 ──────────────────────────────────────────────────────
        // 마감 설정 조회
        const deadlineRes = await query(`SELECT deadline_day, is_enabled FROM we_work_log_deadline_config LIMIT 1`);
        const deadlineCfg = deadlineRes.rows[0];

        if (deadlineCfg?.is_enabled && workDate) {
            const [workYear, workMonth] = workDate.split('-').map(Number);
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth() + 1;
            const todayDay = today.getDate();

            // 과거 달 여부 확인
            const isClosedMonth =
                workYear < todayYear ||
                (workYear === todayYear && workMonth < todayMonth);

            if (isClosedMonth) {
                // 마감일 계산: 해당 달의 다음 달 deadline_day일
                const deadlineYear = workMonth === 12 ? workYear + 1 : workYear;
                const deadlineMonth = workMonth === 12 ? 1 : workMonth + 1;
                const deadlineDay = deadlineCfg.deadline_day;

                // 오늘이 마감일을 지났는지
                const isPastDeadline =
                    todayYear > deadlineYear ||
                    (todayYear === deadlineYear && todayMonth > deadlineMonth) ||
                    (todayYear === deadlineYear && todayMonth === deadlineMonth && todayDay > deadlineDay);

                if (isPastDeadline) {
                    // 월별 해제 여부 확인
                    const unlockRes = await query(
                        `SELECT id FROM we_work_log_deadline_unlocks
                         WHERE target_year = $1 AND target_month = $2`,
                        [workYear, workMonth]
                    );
                    if (unlockRes.rows.length === 0) {
                        return NextResponse.json(
                            { error: `${workYear}년 ${workMonth}월 작업일지는 마감되었습니다. (마감일: ${deadlineYear}-${String(deadlineMonth).padStart(2, '0')}-${String(deadlineDay).padStart(2, '0')})` },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        // 같은 날짜, 같은 사용자의 기존 작업일지와 시간이 겹치면 등록 불가
        if (startTime && endTime) {
            const overlapCheck = await query(
                `SELECT id, start_time, end_time FROM we_work_logs
                 WHERE user_id = $1
                   AND work_date = $2
                   AND start_time IS NOT NULL
                   AND end_time IS NOT NULL
                   AND start_time < $4   -- 기존 시작 < 신규 종료
                   AND end_time   > $3   -- 기존 종료 > 신규 시작
                `,
                [user.id, workDate, startTime, endTime]
            );
            if (overlapCheck.rows.length > 0) {
                const ov = overlapCheck.rows[0];
                return NextResponse.json(
                    {
                        error: `시간이 겹칩니다. 기존 등록된 작업 시간: ${String(ov.start_time).slice(0, 5)} ~ ${String(ov.end_time).slice(0, 5)}`,
                    },
                    { status: 409 }
                );
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
