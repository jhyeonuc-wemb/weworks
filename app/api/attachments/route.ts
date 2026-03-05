import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isBlockedFile } from "@/lib/utils/file-security";

// GET: 첨부파일 목록 조회
export async function GET(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
        return NextResponse.json({ error: "entityType과 entityId는 필수입니다." }, { status: 400 });
    }

    try {
        const result = await query(
            `SELECT a.id, a.entity_type, a.entity_id, a.file_name, a.file_path,
                    a.file_size, a.mime_type, a.created_at,
                    u.name as uploaded_by_name
             FROM we_attachments a
             LEFT JOIN we_users u ON u.id = a.uploaded_by
             WHERE a.entity_type = $1 AND a.entity_id = $2
             ORDER BY a.created_at DESC`,
            [entityType, entityId]
        );

        return NextResponse.json({
            attachments: result.rows.map((r: any) => ({
                id: r.id,
                entityType: r.entity_type,
                entityId: r.entity_id,
                fileName: r.file_name,
                filePath: r.file_path,
                fileSize: r.file_size ? Number(r.file_size) : null,
                mimeType: r.mime_type,
                uploadedByName: r.uploaded_by_name,
                createdAt: r.created_at,
            })),
        });
    } catch (e: any) {
        return NextResponse.json({ error: "조회 실패", details: e.message }, { status: 500 });
    }
}

// POST: 파일 업로드
export async function POST(request: NextRequest) {
    const user = getCurrentUser(request);
    if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

    try {
        const formData = await request.formData();
        const entityType = formData.get("entityType") as string;
        const entityId = formData.get("entityId") as string;
        const files = formData.getAll("files") as File[];

        if (!entityType || !entityId || files.length === 0) {
            return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
        }

        // 저장 디렉토리 생성
        const uploadDir = path.join(process.cwd(), "public", "uploads", entityType, entityId);
        await mkdir(uploadDir, { recursive: true });

        // 차단 확장자 검사
        const blocked = files.filter(f => isBlockedFile(f.name));
        if (blocked.length > 0) {
            return NextResponse.json(
                {
                    error: `보안상 업로드가 허용되지 않는 파일 형식입니다.`,
                    blocked: blocked.map(f => f.name),
                },
                { status: 400 }
            );
        }

        const saved = [];
        for (const file of files) {
            const ext = path.extname(file.name);
            const savedName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
            const filePath = `/uploads/${entityType}/${entityId}/${savedName}`;
            const fullPath = path.join(uploadDir, savedName);

            // 파일 저장
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(fullPath, buffer);

            // DB insert
            const result = await query(
                `INSERT INTO we_attachments
                    (entity_type, entity_id, file_name, saved_name, file_path, file_size, mime_type, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id, file_name, file_path, file_size, mime_type, created_at`,
                [entityType, Number(entityId), file.name, savedName, filePath, file.size, file.type, user.id]
            );
            saved.push({
                id: result.rows[0].id,
                fileName: result.rows[0].file_name,
                filePath: result.rows[0].file_path,
                fileSize: result.rows[0].file_size ? Number(result.rows[0].file_size) : null,
                mimeType: result.rows[0].mime_type,
                createdAt: result.rows[0].created_at,
            });
        }

        return NextResponse.json({ success: true, attachments: saved });
    } catch (e: any) {
        console.error("Attachment upload error:", e);
        return NextResponse.json({ error: "업로드 실패", details: e.message }, { status: 500 });
    }
}
