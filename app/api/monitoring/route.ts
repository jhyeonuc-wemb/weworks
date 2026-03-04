import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureTableExists() {
  await query(`
    CREATE TABLE IF NOT EXISTS we_project_monitoring (
      project_id BIGINT PRIMARY KEY REFERENCES we_projects(id) ON DELETE CASCADE,
      pm_name_override VARCHAR(255),
      pl_name VARCHAR(255),
      actual_start_date DATE,
      actual_end_date DATE,
      progress_status VARCHAR(255),
      performance_rate NUMERIC DEFAULT 0,
      current_phase_override VARCHAR(50),
      progress_state VARCHAR(50) DEFAULT '정상',
      planned_internal_mm NUMERIC DEFAULT 0,
      planned_external_mm NUMERIC DEFAULT 0,
      executed_internal_mm NUMERIC DEFAULT 0,
      executed_external_mm NUMERIC DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `, []);
}

export async function GET(request: NextRequest) {
  try {
    await ensureTableExists();

    const sql = `
      SELECT 
        p.id,
        p.project_code,
        p.name as project_name,
        COALESCE(cat_code.name, pc.name) as category_name,
        fc.name as field_name,
        c.name as customer_name,
        u1.name as manager_name,
        p.actual_start_date as base_actual_start_date,
        p.actual_end_date as base_actual_end_date,
        pm.pm_name_override,
        pm.pl_name,
        pm.actual_start_date as mon_actual_start_date,
        pm.actual_end_date as mon_actual_end_date,
        pm.progress_status,
        pm.performance_rate,
        pm.current_phase_override,
        pm.progress_state,
        pm.planned_internal_mm,
        pm.planned_external_mm,
        pm.executed_internal_mm,
        pm.executed_external_mm
      FROM we_projects p
      LEFT JOIN we_project_categories pc ON p.category_id = pc.id
      LEFT JOIN we_codes cat_code ON p.category_id = cat_code.id
      LEFT JOIN we_codes fc ON p.field_id = fc.id
      LEFT JOIN we_clients c ON p.customer_id = c.id
      LEFT JOIN we_users u1 ON p.manager_id = u1.id
      LEFT JOIN we_project_monitoring pm ON p.id = pm.project_id
      WHERE p.current_phase = 'in_progress'
      ORDER BY p.created_at DESC
    `;

    const result = await query(sql, []);
    console.log('Monitoring API: Found projects count:', result.rows.length);

    // Map data for frontend
    const monitoredProjects = result.rows.map(row => {
      const pmName = row.pm_name_override || row.manager_name || '';
      const actualStartDate = row.mon_actual_start_date || row.base_actual_start_date || '';
      const actualEndDate = row.mon_actual_end_date || row.base_actual_end_date || '';

      return {
        id: row.id,
        project_code: row.project_code,
        project_name: row.project_name,
        category: row.category_name,
        field: row.field_name,
        customer: row.customer_name,
        pm: pmName,
        pl: row.pl_name || '',
        actual_start_date: actualStartDate ? new Date(actualStartDate).toISOString().split('T')[0] : '',
        actual_end_date: actualEndDate ? new Date(actualEndDate).toISOString().split('T')[0] : '',
        progress_status: row.progress_status || '',
        performance_rate: row.performance_rate || 0,
        current_phase: row.current_phase_override || '',
        progress_state: row.progress_state || '정상',
        planned_internal_mm: row.planned_internal_mm || 0,
        planned_external_mm: row.planned_external_mm || 0,
        executed_internal_mm: row.executed_internal_mm || 0,
        executed_external_mm: row.executed_external_mm || 0,
      };
    });

    return NextResponse.json({ data: monitoredProjects });
  } catch (error: any) {
    console.error('Error fetching monitored projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableExists();

    const body = await request.json();
    const {
      id,
      pm,
      pl,
      actual_start_date,
      actual_end_date,
      progress_status,
      performance_rate,
      current_phase,
      progress_state,
      planned_internal_mm,
      planned_external_mm,
      executed_internal_mm,
      executed_external_mm
    } = body;

    const sql = `
      INSERT INTO we_project_monitoring (
        project_id, pm_name_override, pl_name, actual_start_date, actual_end_date,
        progress_status, performance_rate, current_phase_override, progress_state,
        planned_internal_mm, planned_external_mm, executed_internal_mm, executed_external_mm, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id)
      DO UPDATE SET
        pm_name_override = EXCLUDED.pm_name_override,
        pl_name = EXCLUDED.pl_name,
        actual_start_date = EXCLUDED.actual_start_date,
        actual_end_date = EXCLUDED.actual_end_date,
        progress_status = EXCLUDED.progress_status,
        performance_rate = EXCLUDED.performance_rate,
        current_phase_override = EXCLUDED.current_phase_override,
        progress_state = EXCLUDED.progress_state,
        planned_internal_mm = EXCLUDED.planned_internal_mm,
        planned_external_mm = EXCLUDED.planned_external_mm,
        executed_internal_mm = EXCLUDED.executed_internal_mm,
        executed_external_mm = EXCLUDED.executed_external_mm,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await query(sql, [
      id,
      pm || null,
      pl || null,
      actual_start_date || null,
      actual_end_date || null,
      progress_status || null,
      performance_rate || 0,
      current_phase || null,
      progress_state || '정상',
      planned_internal_mm || 0,
      planned_external_mm || 0,
      executed_internal_mm || 0,
      executed_external_mm || 0
    ]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving monitored project:', error);
    return NextResponse.json(
      { error: 'Failed to save', message: error.message },
      { status: 500 }
    );
  }
}
