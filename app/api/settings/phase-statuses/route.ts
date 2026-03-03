import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: 상태 목록 조회 (파라미터 없으면 전체, phaseId 또는 phaseCode로 필터 가능)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phaseId = searchParams.get("phaseId");
        const phaseCode = searchParams.get("phaseCode");

        let result;
        if (phaseCode) {
            // phaseCode(문자열)로 조회 - 프로젝트 목록 필터용
            result = await pool.query(
                `SELECT ps.*
                 FROM project_phase_statuses ps
                 JOIN project_phases pp ON pp.id = ps.phase_id
                 WHERE pp.code = $1 AND ps.is_active = true
                 ORDER BY ps.display_order ASC`,
                [phaseCode]
            );
        } else if (phaseId) {
            // phaseId(숫자)로 조회 - 사업단계 설정 화면용
            result = await pool.query(
                `SELECT ps.*,
                        (SELECT COUNT(*) FROM we_project_phase_progress WHERE status_id = ps.id)::int AS usage_count
                 FROM project_phase_statuses ps
                 WHERE ps.phase_id = $1
                 ORDER BY ps.display_order ASC`,
                [phaseId]
            );
        } else {
            // 파라미터 없음 → 전체 조회 (StatusBadge 전역 캐시용)
            result = await pool.query(
                `SELECT ps.id, ps.code, ps.name, ps.color, ps.phase_id,
                        pp.code as phase_code
                 FROM project_phase_statuses ps
                 JOIN project_phases pp ON pp.id = ps.phase_id
                 WHERE ps.is_active = true
                 ORDER BY pp.display_order ASC, ps.display_order ASC`
            );
        }

        return NextResponse.json({ statuses: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: 상태 추가
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phase_id, code, name, color, display_order, description } = body;
        if (!phase_id || !code || !name) {
            return NextResponse.json({ error: "phase_id, code, name은 필수입니다." }, { status: 400 });
        }
        const result = await pool.query(
            `INSERT INTO project_phase_statuses (phase_id, code, name, color, display_order, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [phase_id, code, name, color || "gray", display_order || 0, description || ""]
        );
        return NextResponse.json({ status: result.rows[0] });
    } catch (error: any) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "이 단계에 이미 존재하는 코드입니다." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 상태 수정
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, color, display_order, is_active, description } = body;
        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        const result = await pool.query(
            `UPDATE project_phase_statuses
             SET name = COALESCE($1, name),
                 color = COALESCE($2, color),
                 display_order = COALESCE($3, display_order),
                 is_active = COALESCE($4, is_active),
                 description = COALESCE($5, description),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [name, color, display_order, is_active, description, id]
        );
        if (result.rowCount === 0) {
            return NextResponse.json({ error: "상태를 찾을 수 없습니다." }, { status: 404 });
        }
        return NextResponse.json({ status: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 상태 삭제
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        // 프로젝트에서 사용 중이면 삭제 불가
        const usageCheck = await pool.query(
            "SELECT COUNT(*) FROM we_project_phase_progress WHERE status_id = $1",
            [id]
        );
        if (parseInt(usageCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: `${usageCheck.rows[0].count}개 프로젝트에서 사용 중이므로 삭제할 수 없습니다.` },
                { status: 409 }
            );
        }
        await pool.query("DELETE FROM project_phase_statuses WHERE id = $1", [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
