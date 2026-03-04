import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapToCamelCase, mapToSnakeCase } from '@/lib/utils/mapper';

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
        rk1.name as manager_rank_name,
        u1.id as manager_id,
        u2.name as sales_representative_name,
        u2.id as sales_representative_id,
        -- 현재 단계 (we_projects.current_phase 직접 사용)
        COALESCE(p.current_phase, 'unknown') as computed_phase,
        -- 현재 단계의 phase_progress 상태 (단일 소스)
        COALESCE(wpp.status, 'STANDBY') as computed_status
      FROM we_projects p
      LEFT JOIN we_project_categories pc ON p.category_id = pc.id
      LEFT JOIN we_codes cat_code ON p.category_id = cat_code.id
      LEFT JOIN we_codes fc ON p.field_id = fc.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      LEFT JOIN we_clients o ON p.orderer_id = o.id
      LEFT JOIN we_users u1 ON p.manager_id = u1.id
      LEFT JOIN we_codes rk1 ON u1.rank_id = rk1.id
      LEFT JOIN we_users u2 ON p.sales_representative_id = u2.id
      -- 현재 단계의 phase_progress 상태만 참조 (단일 소스)
      LEFT JOIN we_project_phase_progress wpp
        ON wpp.project_id = p.id AND wpp.phase_code = p.current_phase
      WHERE p.id = $1
    `;

    const result = await query(sql, [id]);

    const project = result.rows[0];
    return NextResponse.json({
      project: mapToCamelCase({
        ...project,
        current_phase: project.computed_phase,
        status: project.computed_status
      })
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
    const rawBody = await request.json();
    const body = mapToSnakeCase(rawBody) as Record<string, any>;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'project_code', 'category_id', 'field_id', 'project_type_id', 'customer_id', 'orderer_id', 'description',
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

    // 연관 데이터 먼저 삭제 (FK 제약 순서대로)
    const relatedTables = [
      'we_work_logs',
      'we_project_profitability_extra_revenue',
      'we_project_profitability_standard_expenses',
      'we_project_order_proposal',
      'we_project_expense_plan',
      'we_project_manpower_plan',
      'we_project_product_plan',
      'we_project_profitability',
      'we_project_settlement',
      'we_project_vrb_reviews',
      'we_project_md_estimations',
      'we_project_monitoring',
      'we_project_phase_progress',
    ];

    for (const table of relatedTables) {
      await query(`DELETE FROM ${table} WHERE project_id = $1`, [id]);
    }

    // 프로젝트 삭제
    const result = await query(`DELETE FROM we_projects WHERE id = $1 RETURNING id`, [id]);

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

