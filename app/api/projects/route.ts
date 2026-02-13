import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT 
        p.id,
        p.project_code,
        p.name,
        p.status,
        p.current_phase,
        p.process_status,
        p.risk_level,
        p.contract_start_date,
        p.contract_end_date,
        p.currency,
        p.expected_amount,
        COALESCE(cat_code.name, pc.name) as category_name,
        fc.name as field_name,
        c.name as customer_name,
        o.name as orderer_name,
        u1.name as manager_name,
        u2.name as sales_representative_name,
        p.created_at,
        prof.status as profitability_status,
        prof.net_profit,
        prof.profit_rate,
        -- 동적으로 current_phase 계산
        CASE
          WHEN p.status = 'completed' THEN 'completed'
          WHEN p.status = 'profitability_completed' THEN 'settlement'
          WHEN p.status = 'vrb_completed' THEN 'profitability'
          WHEN p.status = 'md_estimation_completed' THEN 'vrb'
          WHEN prof.status IN ('STANDBY', 'IN_PROGRESS') THEN 'profitability'
          WHEN prof.status = 'COMPLETED' THEN 'settlement'
          ELSE COALESCE(p.current_phase, 'sales')
        END as computed_phase
      FROM we_projects p
      LEFT JOIN we_project_categories pc ON p.category_id = pc.id
      LEFT JOIN we_codes cat_code ON p.category_id = cat_code.id
      LEFT JOIN we_codes fc ON p.field_id = fc.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      LEFT JOIN we_clients o ON p.orderer_id = o.id
      LEFT JOIN we_users u1 ON p.manager_id = u1.id
      LEFT JOIN we_users u2 ON p.sales_representative_id = u2.id
      LEFT JOIN (
        SELECT DISTINCT ON (project_id)
          project_id,
          status,
          net_profit,
          profit_rate
        FROM we_project_profitability
        ORDER BY project_id, version DESC
      ) prof ON p.id = prof.project_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (p.name ILIKE $${params.length + 1} OR p.project_code ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (status) {
      sql += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const result = await query(sql, params);

    // computed_phase를 current_phase로 사용
    const projects = result.rows.map((row: any) => {
      // Debug logging for P25-019
      if (row.project_code === 'P25-019') {
        console.log('P25-019 Debug:', {
          project_code: row.project_code,
          profitability_status: row.profitability_status,
          computed_phase: row.computed_phase,
          current_phase: row.current_phase
        });
      }

      return {
        ...row,
        current_phase: row.computed_phase
      };
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', message: error.message },
      { status: 500 }
    );
  }
}

// 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      project_code,
      category_id,
      customer_id,
      orderer_id,
      description,
      contract_start_date,
      contract_end_date,
      actual_start_date,
      actual_end_date,
      expected_amount,
      currency,
      manager_id,
      sales_representative_id,
      process_status,
      risk_level,
      created_by = 1, // TODO: 실제 로그인한 사용자 ID
    } = body;

    // process_status를 current_phase로도 사용 (단계 정보)
    const current_phase = process_status || 'sales';

    const sql = `
      INSERT INTO we_projects (
        name, project_code, category_id, customer_id, orderer_id, description,
        contract_start_date, contract_end_date, actual_start_date, actual_end_date,
        expected_amount, currency, manager_id, sales_representative_id,
        process_status, current_phase, risk_level, field_id, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        COALESCE((SELECT id FROM we_users WHERE id = 10), (SELECT id FROM we_users ORDER BY id LIMIT 1)), 
        'sales_opportunity'
      ) RETURNING id
    `;

    const result = await query(sql, [
      name,
      project_code || null,
      category_id || null,
      customer_id || null,
      orderer_id || null,
      description || null,
      contract_start_date || null,
      contract_end_date || null,
      actual_start_date || null,
      actual_end_date || null,
      expected_amount || null,
      currency || 'KRW',
      manager_id || null,
      sales_representative_id || null,
      process_status || null,
      current_phase,
      risk_level || null,
      body.field_id || null,
    ]);

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', message: error.message },
      { status: 500 }
    );
  }
}
