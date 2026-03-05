import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { unlink, readFile } from "fs/promises";
import path from "path";

// DELETE: 첨부파일 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    const { id } = await params;

    try {
        // 파일 정보 조회
        const result = await query(
            `SELECT id, file_path, saved_name, entity_type, entity_id FROM we_attachments WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
        }

        const row = result.rows[0];
        // 실제 파일 삭제
        const fullPath = path.join(process.cwd(), "public", row.file_path);
        try {
            await unlink(fullPath);
        } catch {
            // 파일이 없어도 DB는 삭제
        }

        // DB 삭제
        await query(`DELETE FROM we_attachments WHERE id = $1`, [id]);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: "삭제 실패", details: e.message }, { status: 500 });
    }
}

// GET: 파일 다운로드
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    const { id } = await params;

    try {
        const result = await query(
            `SELECT file_name, file_path, mime_type FROM we_attachments WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
        }

        const row = result.rows[0];
        const fullPath = path.join(process.cwd(), "public", row.file_path);
        const buffer = await readFile(fullPath);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": row.mime_type || "application/octet-stream",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: "다운로드 실패", details: e.message }, { status: 500 });
    }
}
