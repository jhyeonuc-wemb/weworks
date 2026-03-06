import { query } from '@/lib/db';

/**
 * 특정 단계의 상태 목록을 display_order 순서로 반환
 * (project_phase_statuses 테이블 기반 - 단일 소스)
 */
export async function getPhaseStatuses(phaseCode: string): Promise<{ code: string; name: string; display_order: number; color: string }[]> {
    const res = await query(
        `SELECT pps.code, pps.name, pps.display_order, pps.color
         FROM project_phase_statuses pps
         JOIN project_phases pp ON pp.id = pps.phase_id
         WHERE pp.code = $1 AND pp.is_active = true
         ORDER BY pps.display_order ASC`,
        [phaseCode]
    );
    return res.rows;
}

/**
 * 특정 단계의 첫 번째 상태 코드 반환 (= 초기/대기 상태)
 */
export async function getInitialStatus(phaseCode: string): Promise<string> {
    const statuses = await getPhaseStatuses(phaseCode);
    return statuses[0]?.code ?? 'STANDBY';
}

/**
 * 특정 단계의 마지막 상태 코드 반환 (= 완료 상태)
 */
export async function getFinalStatus(phaseCode: string): Promise<string> {
    const statuses = await getPhaseStatuses(phaseCode);
    return statuses[statuses.length - 1]?.code ?? 'COMPLETED';
}

/**
 * 현재 상태가 해당 단계의 마지막 상태인지 확인
 */
export async function isFinalStatus(phaseCode: string, currentStatus: string): Promise<boolean> {
    const finalCode = await getFinalStatus(phaseCode);
    return currentStatus === finalCode;
}

/**
 * 단계 상태를 업데이트합니다.
 * 상태 코드는 project_phase_statuses에 정의된 코드를 사용합니다.
 * 마지막 상태 진입 시 completed_at 자동 기록, 초기 상태 이후 started_at 기록.
 */
export async function updatePhaseStatus(
    projectId: number,
    phaseCode: string,
    statusCode: string
): Promise<void> {
    const now = new Date().toISOString();

    // 이 단계의 첫/마지막 상태 코드 동적 조회
    const statuses = await getPhaseStatuses(phaseCode);
    const initialCode = statuses[0]?.code;
    const finalCode = statuses[statuses.length - 1]?.code;

    const isInitial = statusCode === initialCode;
    const isFinal = statusCode === finalCode;

    await query(
        `INSERT INTO we_project_phase_progress (project_id, phase_code, status, started_at, completed_at, updated_at)
         VALUES ($1, $2, $3::varchar,
           CASE WHEN $4 = false THEN $5::timestamp ELSE NULL END,
           CASE WHEN $6 = true  THEN $5::timestamp ELSE NULL END,
           $5::timestamp
         )
         ON CONFLICT (project_id, phase_code) DO UPDATE SET
           status = EXCLUDED.status,
           started_at = CASE 
             WHEN we_project_phase_progress.started_at IS NULL AND $4 = false
             THEN EXCLUDED.started_at 
             ELSE we_project_phase_progress.started_at 
           END,
           completed_at = CASE 
             WHEN $6 = true THEN EXCLUDED.completed_at
             ELSE we_project_phase_progress.completed_at
           END,
           updated_at = EXCLUDED.updated_at`,
        [projectId, phaseCode, statusCode, isInitial, now, isFinal]
    );
}

/**
 * 프로젝트 생성 시 모든 활성 단계를 각 단계의 첫 번째 상태로 초기화합니다.
 * (더 이상 'STANDBY' 하드코딩하지 않음)
 * Returns the first phase code to set as current_phase.
 */
export async function initProjectPhases(projectId: number): Promise<string | null> {
    // 전체 활성 단계 + 각 단계의 첫 번째 상태 조회
    const phasesRes = await query(
        `SELECT pp.code, 
                (SELECT pps.code FROM project_phase_statuses pps
                 WHERE pps.phase_id = pp.id
                 ORDER BY pps.display_order ASC LIMIT 1) AS initial_status
         FROM project_phases pp
         WHERE pp.is_active = true
         ORDER BY pp.display_order ASC`
    );

    if (phasesRes.rows.length === 0) return null;

    // 각 단계를 초기 상태로 초기화
    for (const phase of phasesRes.rows) {
        const initialStatus = phase.initial_status ?? 'STANDBY';
        await query(
            `INSERT INTO we_project_phase_progress (project_id, phase_code, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, phase_code) DO NOTHING`,
            [projectId, phase.code, initialStatus]
        );
    }

    return phasesRes.rows[0].code;
}

/**
 * 현재 단계를 완료 처리하고 다음 단계로 자동 이동합니다.
 * "완료"는 해당 단계의 마지막 상태로 설정하는 것입니다.
 * 다음 단계는 해당 단계의 첫 번째 상태로 초기화합니다.
 */
export async function advanceProjectPhase(
    projectId: number,
    currentPhaseCode: string
): Promise<string | null> {
    // 1. 현재 단계의 마지막 상태로 업데이트 (완료 처리)
    const finalStatus = await getFinalStatus(currentPhaseCode);
    await updatePhaseStatus(projectId, currentPhaseCode, finalStatus);

    // 2. 현재 단계의 display_order 조회
    const currentPhaseRes = await query(
        `SELECT display_order FROM project_phases WHERE code = $1 AND is_active = true`,
        [currentPhaseCode]
    );

    if (currentPhaseRes.rows.length === 0) {
        console.warn(`[advanceProjectPhase] Phase not found: ${currentPhaseCode}`);
        return null;
    }

    const currentOrder = currentPhaseRes.rows[0].display_order;

    // 3. 다음 활성 단계 조회 + 첫 번째 상태 코드
    const nextPhaseRes = await query(
        `SELECT pp.code, pp.name,
                (SELECT pps.code FROM project_phase_statuses pps
                 WHERE pps.phase_id = pp.id
                 ORDER BY pps.display_order ASC LIMIT 1) AS initial_status
         FROM project_phases pp
         WHERE pp.display_order > $1 AND pp.is_active = true
         ORDER BY pp.display_order ASC
         LIMIT 1`,
        [currentOrder]
    );

    if (nextPhaseRes.rows.length === 0) {
        // 마지막 단계 - 프로젝트 최종 완료
        console.log(`[advanceProjectPhase] Project ${projectId} reached final phase.`);
        await query(
            `UPDATE we_projects SET status = 'completed', current_phase = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [projectId]
        );
        return 'completed';
    }

    const nextPhase = nextPhaseRes.rows[0];
    const nextPhaseCode = nextPhase.code;
    const nextInitialStatus = nextPhase.initial_status ?? 'STANDBY';

    // 4. we_projects.current_phase 업데이트
    //    단, 이미 더 앞선 단계가 current_phase인 경우 뒤로 밀리지 않도록
    //    nextPhase의 display_order가 현재 current_phase보다 클 때만 갱신
    await query(
        `UPDATE we_projects
         SET current_phase = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND (
             current_phase IS NULL
             OR current_phase = $3
             OR (
               SELECT COALESCE(pp_cur.display_order, 0)
               FROM project_phases pp_cur
               WHERE pp_cur.code = we_projects.current_phase
             ) < $4
           )`,
        [nextPhaseCode, projectId, currentPhaseCode, currentOrder + 1]
    );

    // 5. 다음 단계의 phase_progress 초기화 (첫 번째 상태로)
    await query(
        `INSERT INTO we_project_phase_progress (project_id, phase_code, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, phase_code) DO NOTHING`,
        [projectId, nextPhaseCode, nextInitialStatus]
    );

    console.log(`[advanceProjectPhase] Project ${projectId}: ${currentPhaseCode}(${finalStatus}) → ${nextPhaseCode}(${nextInitialStatus})`);
    return nextPhaseCode;
}

/**
 * 프로젝트의 전체 단계별 진행 상태를 그룹 정보 + 단계별 상태 목록과 함께 반환합니다.
 */
export async function getProjectPhaseProgress(projectId: number) {
    const result = await query(
        `SELECT 
           pp.code, pp.name, pp.display_order, pp.phase_group, pp.path,
           g.name AS group_name, g.color AS group_color,
           -- 프로젝트 진행 상태 (없으면 해당 단계의 첫 번째 상태로 기본값)
           COALESCE(
             ppp.status,
             (SELECT pps2.code FROM project_phase_statuses pps2
              WHERE pps2.phase_id = pp.id
              ORDER BY pps2.display_order ASC LIMIT 1)
           ) AS status,
           ppp.started_at, ppp.completed_at,
           -- 이 단계의 첫 번째 / 마지막 상태 코드 (UI 조건 판단용)
           (SELECT pps.code FROM project_phase_statuses pps
            WHERE pps.phase_id = pp.id ORDER BY pps.display_order ASC LIMIT 1) AS initial_status,
           (SELECT pps.code FROM project_phase_statuses pps
            WHERE pps.phase_id = pp.id ORDER BY pps.display_order DESC LIMIT 1) AS final_status
         FROM project_phases pp
         LEFT JOIN project_phase_groups g ON g.code = pp.phase_group
         LEFT JOIN we_project_phase_progress ppp
           ON ppp.project_id = $1 AND ppp.phase_code = pp.code
         WHERE pp.is_active = true
         ORDER BY pp.display_order`,
        [projectId]
    );
    return result.rows;
}
