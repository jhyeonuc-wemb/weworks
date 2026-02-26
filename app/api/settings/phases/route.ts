
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const result = await pool.query(
            "SELECT * FROM project_phases ORDER BY display_order ASC"
        );
        return NextResponse.json({ phases: result.rows });
    } catch (error: any) {
        console.error("Error fetching project phases:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, phase_group, path, display_order, description } = body;

        // Validation
        if (!code || !name || !phase_group) {
            return NextResponse.json(
                { error: "Missing required fields (code, name, phase_group)" },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `INSERT INTO project_phases 
       (code, name, phase_group, path, display_order, description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [code, name, phase_group, path || "", display_order || 0, description || ""]
        );

        return NextResponse.json({ phase: result.rows[0] });
    } catch (error: any) {
        console.error("Error creating project phase:", error);
        // Unique constraint violation check
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "Phase with this code already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, code, name, phase_group, path, display_order, is_active, description } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing phase ID" }, { status: 400 });
        }

        const result = await pool.query(
            `UPDATE project_phases 
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           phase_group = COALESCE($3, phase_group),
           path = COALESCE($4, path),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active),
           description = COALESCE($7, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
            [code, name, phase_group, path, display_order, is_active, description, id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Phase not found" }, { status: 404 });
        }

        return NextResponse.json({ phase: result.rows[0] });
    } catch (error: any) {
        console.error("Error updating project phase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing phase ID" }, { status: 400 });
        }

        // 삭제 전 phase_group 파악
        const phaseResult = await pool.query(
            "SELECT phase_group FROM project_phases WHERE id = $1",
            [id]
        );
        const phaseGroup = phaseResult.rows[0]?.phase_group;

        // 삭제 실행
        await pool.query("DELETE FROM project_phases WHERE id = $1", [id]);

        // 동일 phase_group 내 남은 단계들 display_order를 1부터 재정렬
        if (phaseGroup) {
            const remaining = await pool.query(
                "SELECT id FROM project_phases WHERE phase_group = $1 ORDER BY display_order ASC, id ASC",
                [phaseGroup]
            );
            for (let i = 0; i < remaining.rows.length; i++) {
                await pool.query(
                    "UPDATE project_phases SET display_order = $1 WHERE id = $2",
                    [i + 1, remaining.rows[i].id]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting project phase:", error);
        if (error.code === "23503") {
            return NextResponse.json(
                { error: "Cannot delete phase because it is being used by projects." },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
