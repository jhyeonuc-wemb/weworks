import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/settings/phases
 * 단계 목록(flat) 조회 - 새 project_phases 테이블 기반
 * 단계 편집은 /settings/business-phases 화면에서만 가능합니다.
 */
export async function GET() {
    try {
        const result = await pool.query(
            `SELECT p.*, g.name AS group_name, g.color AS group_color
             FROM project_phases p
             LEFT JOIN project_phase_groups g ON p.group_id = g.id
             WHERE p.is_active = true
             ORDER BY p.display_order ASC`
        );
        return NextResponse.json({ phases: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/settings/phases
 * 단계 추가 (business-phases 화면에서 호출)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, group_id, phase_group, path, display_order, description } = body;

        if (!code || !name || !group_id) {
            return NextResponse.json({ error: "code, name, group_id는 필수입니다." }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO project_phases (code, name, group_id, phase_group, path, display_order, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [code, name, group_id, phase_group || "", path || "", display_order || 0, description || ""]
        );
        return NextResponse.json({ phase: result.rows[0] });
    } catch (error: any) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "이미 존재하는 코드입니다." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/settings/phases
 * 단계 수정 (business-phases 화면에서 호출)
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, code, name, group_id, phase_group, path, display_order, is_active, description } = body;

        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        const result = await pool.query(
            `UPDATE project_phases
             SET code           = COALESCE($1, code),
                 name           = COALESCE($2, name),
                 group_id       = COALESCE($3, group_id),
                 phase_group    = COALESCE($4, phase_group),
                 path           = COALESCE($5, path),
                 display_order  = COALESCE($6, display_order),
                 is_active      = COALESCE($7, is_active),
                 description    = COALESCE($8, description),
                 updated_at     = CURRENT_TIMESTAMP
             WHERE id = $9 RETURNING *`,
            [code, name, group_id, phase_group, path, display_order, is_active, description, id]
        );
        if (result.rowCount === 0) {
            return NextResponse.json({ error: "단계를 찾을 수 없습니다." }, { status: 404 });
        }
        return NextResponse.json({ phase: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/settings/phases?id=<id>
 * 단계 삭제 (business-phases 화면에서 호출)
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        // 사용 중인 단계 삭제 불가
        const usageCheck = await pool.query(
            "SELECT COUNT(*) FROM we_projects WHERE current_phase = (SELECT code FROM project_phases WHERE id = $1)",
            [id]
        );
        if (parseInt(usageCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: `${usageCheck.rows[0].count}개 프로젝트에서 사용 중이므로 삭제할 수 없습니다.` },
                { status: 409 }
            );
        }

        // 삭제 전 group_id 파악 (재정렬용)
        const phaseRow = await pool.query("SELECT group_id FROM project_phases WHERE id = $1", [id]);
        const groupId = phaseRow.rows[0]?.group_id;

        await pool.query("DELETE FROM project_phases WHERE id = $1", [id]);

        // 같은 그룹 내 display_order 재정렬
        if (groupId) {
            const remaining = await pool.query(
                "SELECT id FROM project_phases WHERE group_id = $1 ORDER BY display_order ASC, id ASC",
                [groupId]
            );
            for (let i = 0; i < remaining.rows.length; i++) {
                await pool.query("UPDATE project_phases SET display_order = $1 WHERE id = $2", [i + 1, remaining.rows[i].id]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "23503") {
            return NextResponse.json({ error: "연결된 데이터가 있어 삭제할 수 없습니다." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
