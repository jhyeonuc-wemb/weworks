import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// M/D 산정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        m.id,
        m.project_id,
        m.version,
        m.status,
        m.project_difficulty,
        m.total_development_md,
        m.total_modeling_3d_md,
        m.total_pid_md,
        m.total_development_mm,
        m.total_modeling_3d_mm,
        m.total_pid_mm,
        m.total_mm,
        m.created_at,
        p.name as project_name,
        p.project_code,
        c.name as customer_name
      FROM we_project_md_estimations m
      LEFT JOIN we_projects p ON m.project_id = p.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId) {
      sql += ` AND m.project_id = $${params.length + 1}`;
      // project_id를 명시적으로 숫자로 변환
      params.push(parseInt(projectId, 10));
      console.log('[API GET] projectId 필터링:', {
        original: projectId,
        parsed: parseInt(projectId, 10),
        type: typeof parseInt(projectId, 10)
      });
    }

    if (status) {
      sql += ` AND m.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY m.project_id, m.version DESC`;

    const result = await query(sql, params);

    console.log('[API GET] 조회 결과:', {
      projectId: projectId,
      '조회된 개수': result.rows.length,
      '각 산정의 project_id': result.rows.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        project_id_type: typeof r.project_id,
        status: r.status,
        version: r.version
      }))
    });

    return NextResponse.json({ estimations: result.rows });
  } catch (error: any) {
    console.error('Error fetching MD estimations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MD estimations', message: error.message },
      { status: 500 }
    );
  }
}

// M/D 산정 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, version = 1, created_by = 1 } = body;

    // 프로젝트 ID 필수 검증
    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // project_id를 숫자로 변환
    const projectIdNum = parseInt(project_id);

    // 기존 standby 산정이 있는지 먼저 확인
    const existingDraftCheck = await query(
      `SELECT id, version, project_id FROM we_project_md_estimations WHERE project_id = $1 AND status = 'STANDBY' ORDER BY version DESC LIMIT 1`,
      [projectIdNum]
    );

    // 기존 standby 산정이 있으면 그 ID를 반환 (새로 생성하지 않고 기존 것을 사용)
    if (existingDraftCheck.rows.length > 0) {
      const existingDraft = existingDraftCheck.rows[0];
      console.log(`Found existing standby: id=${existingDraft.id}, project_id=${existingDraft.project_id}, version=${existingDraft.version}`);
      return NextResponse.json({
        id: existingDraft.id,
        version: existingDraft.version,
        isExisting: true
      });
    }

    // 최신 버전 확인 (완료된 산정만 고려)
    const versionCheck = await query(
      `SELECT MAX(version) as max_version FROM we_project_md_estimations WHERE project_id = $1 AND status = 'COMPLETED'`,
      [projectIdNum]
    );
    const maxVersion = versionCheck.rows[0]?.max_version || 0;
    // 새 버전은 완료된 최대 버전 + 1
    // standby 상태의 산정이 있어도 버전은 올리지 않음 (완료 시에만 버전 증가)
    const newVersion = maxVersion + 1;

    console.log(`Creating new MD estimation: project_id=${projectIdNum}, version=${newVersion}`);

    const sql = `
      INSERT INTO we_project_md_estimations (
        project_id, version, status, created_by
      ) VALUES ($1, $2, 'STANDBY', $3)
      RETURNING id, project_id
    `;

    const result = await query(sql, [projectIdNum, newVersion, created_by]);
    const newEstimation = result.rows[0];

    console.log(`Created new MD estimation: id=${newEstimation.id}, project_id=${newEstimation.project_id}, version=${newVersion}`);

    return NextResponse.json({ id: newEstimation.id, version: newVersion });
  } catch (error: any) {
    console.error('Error creating MD estimation:', error);
    return NextResponse.json(
      { error: 'Failed to create MD estimation', message: error.message },
      { status: 500 }
    );
  }
}
