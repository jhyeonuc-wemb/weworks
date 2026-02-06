import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 수지분석서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    let sql = `
      SELECT 
        p.id,
        p.project_id,
        p.version,
        p.status,
        COALESCE(p.total_revenue, 0) as total_revenue,
        COALESCE(p.total_cost, 0) as total_cost,
        COALESCE(p.net_profit, 0) as net_profit,
        COALESCE(p.profit_rate, 0) as profit_rate,
        TO_CHAR(p.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as created_at,
        TO_CHAR(p.written_date, 'YYYY-MM-DD') as written_date,
        TO_CHAR(p.approved_date, 'YYYY-MM-DD') as approved_date,
        pr.name AS project_name,
        pr.project_code,
        c.name AS customer_name,
        COALESCE(m.our_mm, 0) as our_mm,
        COALESCE(m.others_mm, 0) as others_mm
      FROM we_project_profitability p
      LEFT JOIN we_projects pr ON p.project_id = pr.id
      LEFT JOIN we_clients c ON pr.customer_id = c.id
      LEFT JOIN (
        SELECT 
          project_id,
          SUM(CASE WHEN affiliation_group NOT LIKE '외주%' THEN (SELECT SUM(val::numeric) FROM jsonb_each_text(COALESCE(monthly_allocation, '{}'::jsonb)) AS x(key, val)) ELSE 0 END) as our_mm,
          SUM(CASE WHEN affiliation_group LIKE '외주%' THEN (SELECT SUM(val::numeric) FROM jsonb_each_text(COALESCE(monthly_allocation, '{}'::jsonb)) AS x(key, val)) ELSE 0 END) as others_mm
        FROM we_project_manpower_plan
        GROUP BY project_id
      ) m ON p.project_id = m.project_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId && !isNaN(parseInt(projectId, 10))) {
      sql += ` AND p.project_id = $${params.length + 1}`;
      params.push(parseInt(projectId, 10));
    }

    if (status) {
      sql += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY p.project_id, p.version DESC`;

    const result = await query(sql, params);

    return NextResponse.json({ profitabilities: result.rows });
  } catch (error: any) {
    console.error("Error fetching profitabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch profitabilities", message: error.message },
      { status: 500 }
    );
  }
}

// 수지분석서 헤더 생성 (M/D 산정과 동일한 패턴: 기존 draft 재사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, created_by = 1 } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // 프로젝트 존재 여부 확인
    const projectCheck = await query(
      `SELECT id FROM we_projects WHERE id = $1`,
      [project_id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectIdNum = parseInt(project_id);

    // 기존 작성 중이거나 미작성인 수지분석서가 있는지 확인
    const existingDraftCheck = await query(
      `SELECT id, version, project_id, status FROM we_project_profitability 
       WHERE project_id = $1 AND status IN ('not_started', 'in_progress') 
       ORDER BY version DESC LIMIT 1`,
      [projectIdNum]
    );

    if (existingDraftCheck.rows.length > 0) {
      const existing = existingDraftCheck.rows[0];
      return NextResponse.json({
        id: existing.id,
        version: existing.version,
        profitability: existing,
        isExisting: true,
      });
    }

    // 완료된 버전 중 최대 버전 확인
    const versionCheck = await query(
      `SELECT MAX(version) AS max_version FROM we_project_profitability WHERE project_id = $1 AND status = 'completed'`,
      [projectIdNum]
    );
    const maxVersion = versionCheck.rows[0]?.max_version || 0;
    const newVersion = Number(maxVersion) + 1;

    const insertSql = `
      INSERT INTO we_project_profitability (
        project_id, version, status, created_by
      ) VALUES ($1, $2, 'not_started', $3)
      RETURNING id, project_id, version, status
    `;

    const result = await query(insertSql, [
      projectIdNum,
      newVersion,
      created_by,
    ]);
    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      project_id: row.project_id,
      version: newVersion,
      profitability: row,
    });
  } catch (error: any) {
    console.error("Error creating profitability:", error);
    return NextResponse.json(
      { error: "Failed to create profitability", message: error.message },
      { status: 500 }
    );
  }
}

