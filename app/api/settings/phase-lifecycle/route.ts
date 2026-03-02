import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: 그룹 → 단계 → 상태 전체 트리 반환
export async function GET() {
    try {
        const groupsResult = await pool.query(`
            SELECT * FROM project_phase_groups ORDER BY display_order ASC
        `);

        const phasesResult = await pool.query(`
            SELECT p.*,
                   g.name AS group_name, g.color AS group_color
            FROM project_phases p
            LEFT JOIN project_phase_groups g ON p.group_id = g.id
            ORDER BY p.display_order ASC
        `);

        const statusesResult = await pool.query(`
            SELECT ps.*,
                   (SELECT COUNT(*) FROM we_project_phase_progress 
                    WHERE status_id = ps.id)::int AS usage_count
            FROM project_phase_statuses ps
            ORDER BY ps.phase_id, ps.display_order ASC
        `);

        // 트리 조합
        const statusesByPhase: Record<number, any[]> = {};
        for (const s of statusesResult.rows) {
            if (!statusesByPhase[s.phase_id]) statusesByPhase[s.phase_id] = [];
            statusesByPhase[s.phase_id].push(s);
        }

        const phasesByGroup: Record<number, any[]> = {};
        for (const p of phasesResult.rows) {
            const gid = p.group_id;
            if (!phasesByGroup[gid]) phasesByGroup[gid] = [];
            phasesByGroup[gid].push({ ...p, statuses: statusesByPhase[p.id] || [] });
        }

        const tree = groupsResult.rows.map((g) => ({
            ...g,
            phases: phasesByGroup[g.id] || [],
        }));

        return NextResponse.json({ tree });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
