import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 프로젝트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = `
      SELECT 
        p.*,
        COALESCE(cat_code.name, pc.name) as category_name,
        fc.name as field_name,
        c.name as customer_name,
        o.name as orderer_name,
        u1.name as manager_name,
        u1.id as manager_id,
        u2.name as sales_representative_name,
        u2.id as sales_representative_id,
        prof.status as profitability_status,
        -- 동적으로 computed_phase 계산 (current_phase 우선 사용)
        CASE
          WHEN p.current_phase = 'completed' THEN 'completed'
          WHEN p.current_phase = 'settlement' OR settle.status IS NOT NULL THEN 'settlement'
          WHEN p.current_phase = 'in_progress' THEN 'in_progress'
          WHEN p.current_phase = 'profitability' OR prof.status IS NOT NULL THEN 'profitability'
          WHEN p.current_phase = 'vrb' OR vrb.status IS NOT NULL THEN 'vrb'
          WHEN p.current_phase = 'md_estimation' OR md.status IS NOT NULL THEN 'md_estimation'
          ELSE COALESCE(p.current_phase, 'md_estimation')
        END as computed_phase,
        -- 동적으로 computed_status 계산 (현재 단계의 모듈 테이블 실제 상태 반영)
        CASE
          WHEN p.current_phase = 'completed' THEN 'COMPLETED'
          WHEN p.current_phase = 'in_progress' THEN 'PROGRESSING'
          WHEN p.current_phase = 'settlement' OR settle.status IS NOT NULL
            THEN COALESCE(settle.status, 'STANDBY')
          WHEN p.current_phase = 'profitability' OR prof.status IS NOT NULL
            THEN COALESCE(prof.status, 'STANDBY')
          WHEN p.current_phase = 'vrb' OR vrb.status IS NOT NULL
            THEN COALESCE(vrb.status, 'STANDBY')
          WHEN p.current_phase = 'md_estimation' OR md.status IS NOT NULL
            THEN COALESCE(md.status, 'STANDBY')
          ELSE 'STANDBY'
        END as computed_status
      FROM we_projects p
      LEFT JOIN we_project_categories pc ON p.category_id = pc.id
      LEFT JOIN we_codes cat_code ON p.category_id = cat_code.id
      LEFT JOIN we_codes fc ON p.field_id = fc.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      LEFT JOIN we_clients o ON p.orderer_id = o.id
      LEFT JOIN we_users u1 ON p.manager_id = u1.id
      LEFT JOIN we_users u2 ON p.sales_representative_id = u2.id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id) project_id, status
        FROM we_project_profitability
        ORDER BY project_id, version DESC
      ) prof ON p.id = prof.project_id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id) project_id, status
        FROM we_project_md_estimations
        ORDER BY project_id, version DESC
      ) md ON p.id = md.project_id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id) project_id, status
        FROM we_project_vrb_reviews
        ORDER BY project_id, id DESC
      ) vrb ON p.id = vrb.project_id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id) project_id, status
        FROM we_project_settlement
        ORDER BY project_id, id DESC
      ) settle ON p.id = settle.project_id
      WHERE p.id = $1
    `;

    const result = await query(sql, [id]);

    const project = result.rows[0];
    return NextResponse.json({
      project: {
        ...project,
        current_phase: project.computed_phase,
        status: project.computed_status
      }
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', message: error.message },
      { status: 500 }
    );
  }
}

// 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'project_code', 'category_id', 'field_id', 'customer_id', 'orderer_id', 'description',
      'contract_start_date', 'contract_end_date', 'actual_start_date', 'actual_end_date',
      'expected_amount', 'currency', 'manager_id', 'sales_representative_id',
      'process_status', 'risk_level', 'status', 'current_phase'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    // process_status가 업데이트되면 current_phase도 함께 업데이트
    if (body.process_status !== undefined && body.current_phase === undefined) {
      updateFields.push(`current_phase = $${paramIndex}`);
      values.push(body.process_status);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `
      UPDATE we_projects 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    return NextResponse.json({ project: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project', message: error.message },
      { status: 500 }
    );
  }
}

// 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 프로젝트 삭제
    const sql = `DELETE FROM we_projects WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', message: error.message },
      { status: 500 }
    );
  }
}
