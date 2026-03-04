import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/work-logs/migrate — sub_category 컬럼 추가
export async function GET() {
    try {
        await query(`
            ALTER TABLE we_work_logs
            ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100)
        `);
        return NextResponse.json({ success: true, message: "sub_category 컬럼 추가 완료" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
