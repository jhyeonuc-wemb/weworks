import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: 모든 그룹 조회 (단계 수 포함)
export async function GET() {
    try {
        const result = await pool.query(`
            SELECT g.*,
                   COUNT(p.id)::int AS phase_count
            FROM project_phase_groups g
            LEFT JOIN project_phases p ON p.group_id = g.id
            GROUP BY g.id
            ORDER BY g.display_order ASC
        `);
        return NextResponse.json({ groups: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: 그룹 추가
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, color, display_order, description } = body;
        if (!code || !name) {
            return NextResponse.json({ error: "code, name은 필수입니다." }, { status: 400 });
        }
        const result = await pool.query(
            `INSERT INTO project_phase_groups (code, name, color, display_order, description)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [code, name, color || "blue", display_order || 0, description || ""]
        );
        return NextResponse.json({ group: result.rows[0] });
    } catch (error: any) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "이미 존재하는 코드입니다." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 그룹 수정
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, color, display_order, is_active, description } = body;
        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        const result = await pool.query(
            `UPDATE project_phase_groups
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
            return NextResponse.json({ error: "그룹을 찾을 수 없습니다." }, { status: 404 });
        }
        return NextResponse.json({ group: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 그룹 삭제
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

        // 단계가 있으면 삭제 불가
        const phaseCheck = await pool.query(
            "SELECT COUNT(*) FROM project_phases WHERE group_id = $1",
            [id]
        );
        if (parseInt(phaseCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: "이 그룹에 속한 단계가 있어 삭제할 수 없습니다." },
                { status: 409 }
            );
        }
        await pool.query("DELETE FROM project_phase_groups WHERE id = $1", [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
