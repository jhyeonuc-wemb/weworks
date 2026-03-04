import { query } from '@/lib/db';

export interface GetProjectsFilters {
  search?: string;
  status?: string;
}

export interface CreateProjectParams {
  name: string;
  projectCode?: string;
  categoryId?: number;
  projectTypeId?: number;
  customerId?: number;
  ordererId?: number;
  description?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  expectedAmount?: number;
  currency?: string;
  managerId?: number;
  salesRepresentativeId?: number;
  processStatus?: string;
  currentPhase: string;
  riskLevel?: string;
  fieldId?: number;
  createdBy: number;
}

export class ProjectRepository {
  /**
   * 프로젝트 목록 데이터베이스 리스트 전체 조회
   * computed_phase는 we_project_phase_progress 기반으로 단순화
   */
  static async findAll(filters: GetProjectsFilters = {}) {
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
        prof.net_profit,
        prof.profit_rate,
        -- current_phase 기반 단순 계산 (we_project_phase_progress 참조)
        COALESCE(p.current_phase, 'unknown') as computed_phase,
        -- 현재 단계의 progress 상태
        COALESCE(wpp.status, 'STANDBY') as computed_status
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
      -- 현재 단계의 progress 상태 참조
      LEFT JOIN we_project_phase_progress wpp
        ON wpp.project_id = p.id AND wpp.phase_code = p.current_phase
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      sql += ` AND (p.name ILIKE $${params.length + 1} OR p.project_code ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.status) {
      sql += ` AND p.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * 신규 프로젝트 생성
   */
  static async create(data: CreateProjectParams) {
    const sql = `
      INSERT INTO we_projects (
        name, project_code, category_id, project_type_id, customer_id, orderer_id, description,
        contract_start_date, contract_end_date, actual_start_date, actual_end_date,
        expected_amount, currency, manager_id, sales_representative_id,
        process_status, current_phase, risk_level, field_id, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        'active'
      ) RETURNING id
    `;

    const result = await query(sql, [
      data.name,
      data.projectCode || null,
      data.categoryId || null,
      data.projectTypeId || null,
      data.customerId || null,
      data.ordererId || null,
      data.description || null,
      data.contractStartDate || null,
      data.contractEndDate || null,
      data.actualStartDate || null,
      data.actualEndDate || null,
      data.expectedAmount || null,
      data.currency || 'KRW',
      data.managerId || null,
      data.salesRepresentativeId || null,
      data.processStatus || null,
      data.currentPhase,
      data.riskLevel || null,
      data.fieldId || null,
      data.createdBy,
    ]);

    return result.rows[0].id;
  }

  /**
   * 프로젝트의 현재 단계(current_phase) 업데이트
   */
  static async updateCurrentPhase(projectId: number, phaseCode: string) {
    await query(
      `UPDATE we_projects SET current_phase = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [phaseCode, projectId]
    );
  }
}
