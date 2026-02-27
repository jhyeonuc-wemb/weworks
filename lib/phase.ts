import { query } from '@/lib/db';

/**
 * 단계 상태를 업데이트합니다.
 * STANDBY → IN_PROGRESS → COMPLETED 순서로 진행됩니다.
 */
export async function updatePhaseStatus(
    projectId: number,
    phaseCode: string,
    status: 'STANDBY' | 'IN_PROGRESS' | 'COMPLETED'
): Promise<void> {
    const now = new Date().toISOString();

    await query(
        `INSERT INTO we_project_phase_progress (project_id, phase_code, status, started_at, completed_at, updated_at)
     VALUES ($1, $2, $3::varchar,
       CASE WHEN $3::varchar IN ('IN_PROGRESS', 'COMPLETED') THEN $4::timestamp ELSE NULL END,
       CASE WHEN $3::varchar = 'COMPLETED' THEN $4::timestamp ELSE NULL END,
       $4::timestamp
     )
     ON CONFLICT (project_id, phase_code) DO UPDATE SET
       status = EXCLUDED.status,
       started_at = CASE 
         WHEN we_project_phase_progress.started_at IS NULL AND EXCLUDED.status IN ('IN_PROGRESS', 'COMPLETED')
         THEN EXCLUDED.started_at 
         ELSE we_project_phase_progress.started_at 
       END,
       completed_at = CASE 
         WHEN EXCLUDED.status = 'COMPLETED' THEN EXCLUDED.completed_at
         ELSE we_project_phase_progress.completed_at
       END,
       updated_at = EXCLUDED.updated_at`,
        [projectId, phaseCode, status, now]
    );
}

/**
 * 현재 단계를 완료 처리하고, project_phases의 display_order 기준으로
 * 다음 활성 단계로 자동 이동합니다.
 */
export async function advanceProjectPhase(
    projectId: number,
    currentPhaseCode: string
): Promise<string | null> {
    // 1. 현재 단계의 display_order 조회
    const currentPhaseRes = await query(
        `SELECT display_order FROM project_phases WHERE code = $1 AND is_active = true`,
        [currentPhaseCode]
    );

    if (currentPhaseRes.rows.length === 0) {
        console.warn(`[advanceProjectPhase] Phase not found: ${currentPhaseCode}`);
        return null;
    }

    const currentOrder = currentPhaseRes.rows[0].display_order;

    // 2. 다음 활성 단계 조회 (display_order 기준)
    const nextPhaseRes = await query(
        `SELECT code, name FROM project_phases
     WHERE display_order > $1 AND is_active = true
     ORDER BY display_order ASC
     LIMIT 1`,
        [currentOrder]
    );

    if (nextPhaseRes.rows.length === 0) {
        // 마지막 단계 - 프로젝트 최종 완료 처리
        console.log(`[advanceProjectPhase] Project ${projectId} reached final phase. Marking completed.`);
        await query(
            `UPDATE we_projects SET status = 'completed', current_phase = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [projectId]
        );
        return 'completed';
    }

    const nextPhaseCode = nextPhaseRes.rows[0].code;

    // 3. we_projects.current_phase 업데이트
    await query(
        `UPDATE we_projects SET current_phase = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [nextPhaseCode, projectId]
    );

    // 4. 다음 단계의 phase_progress 레코드 UPSERT (STANDBY)
    await query(
        `INSERT INTO we_project_phase_progress (project_id, phase_code, status)
     VALUES ($1, $2, 'STANDBY')
     ON CONFLICT (project_id, phase_code) DO NOTHING`,
        [projectId, nextPhaseCode]
    );

    console.log(`[advanceProjectPhase] Project ${projectId}: ${currentPhaseCode} → ${nextPhaseCode}`);
    return nextPhaseCode;
}

/**
 * 프로젝트의 전체 단계별 진행 상태를 반환합니다.
 */
export async function getProjectPhaseProgress(projectId: number) {
    const result = await query(
        `SELECT 
       pp.code, pp.name, pp.display_order, pp.phase_group, pp.path,
       COALESCE(ppp.status, 'STANDBY') as status,
       ppp.started_at, ppp.completed_at
     FROM project_phases pp
     LEFT JOIN we_project_phase_progress ppp
       ON ppp.project_id = $1 AND ppp.phase_code = pp.code
     WHERE pp.is_active = true
     ORDER BY pp.display_order`,
        [projectId]
    );
    return result.rows;
}
