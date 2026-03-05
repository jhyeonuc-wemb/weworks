import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year') || new Date().getFullYear().toString();
    const year = parseInt(yearStr);

    try {
        // 1. 사용자 정보 (부서 포함)
        const usersRes = await query(`
            SELECT u.id, u.name, u.grade, u.position, u.status, d.name as department_name, d.id as department_id,
                   (SELECT name FROM we_codes r WHERE r.id = u.rank_id) as rank_name
            FROM we_users u
            LEFT JOIN we_departments d ON u.department_id = d.id
            WHERE UPPER(u.status) = 'ACTIVE'
        `);

        // 2. 부서 정보 (포함 관계 구성용)
        const departmentsRes = await query(`
            SELECT id, name, parent_department_id, display_order
            FROM we_departments
            ORDER BY display_order ASC
        `);

        // 3. WIMS 카테고리 (CD_002_05의 하위 항목 중 일반 업무(05) 제외)
        const categoriesRes = await query(`
            SELECT code, name 
            FROM we_codes 
            WHERE parent_id = (SELECT id FROM we_codes WHERE code = 'CD_002_05') 
              AND code != 'CD_002_05_05'
        `);

        // 4. 휴일 데이터
        const holidayRes = await query(`
            SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as date, name
            FROM holidays
            WHERE EXTRACT(YEAR FROM holiday_date) = $1
        `, [year]);

        // 5. 작업 일지 데이터 (해당 연도, 시스템 내 설정 코드와 동적 매핑)
        const logsRes = await query(`
            SELECT 
                w.user_id,
                TO_CHAR(w.work_date, 'YYYY-MM-DD') as date,
                c.code as category_code,
                SUM(
                    GREATEST(0, 
                        EXTRACT(EPOCH FROM (
                            LEAST(w.end_time, '18:00:00') - GREATEST(w.start_time, '09:00:00')
                        )) / 3600
                    )
                ) as hours
            FROM we_work_logs w
            JOIN we_codes c ON w.category LIKE c.code || '%'
            WHERE EXTRACT(YEAR FROM w.work_date) = $1
              AND c.parent_id = (SELECT id FROM we_codes WHERE code = 'CD_002_05')
              AND c.code != 'CD_002_05_05'
            GROUP BY w.user_id, w.work_date, c.code
        `, [year]);

        return NextResponse.json({
            users: usersRes.rows,
            departments: departmentsRes.rows,
            categories: categoriesRes.rows,
            holidays: holidayRes.rows,
            logs: logsRes.rows,
        });

    } catch (error) {
        console.error("Utilization Data Fetch Error:", error);
        return NextResponse.json({ error: "가동률 데이터를 불러오는데 실패했습니다." }, { status: 500 });
    }
}
