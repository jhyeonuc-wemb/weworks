import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
        SELECT DISTINCT ON (project_id) project_id, status, net_profit, profit_rate
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
        current_phase: row.computed_phase,
        status: row.computed_status
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
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

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
    } = body;
    const created_by = user.id;

    // process_status를 current_phase로도 사용 (단계 정보)
    const current_phase = process_status || 'md_estimation';

    const sql = `
      INSERT INTO we_projects (
        name, project_code, category_id, customer_id, orderer_id, description,
        contract_start_date, contract_end_date, actual_start_date, actual_end_date,
        expected_amount, currency, manager_id, sales_representative_id,
        process_status, current_phase, risk_level, field_id, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        'active'
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
      created_by,
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
