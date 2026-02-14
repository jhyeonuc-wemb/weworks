import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const parentCode = searchParams.get("parentCode");

    if (!parentCode) {
        return NextResponse.json({ error: "Parent code is required" }, { status: 400 });
    }

    try {
        const sql = `
      SELECT c.code, c.name, c.display_order
      FROM we_codes c
      JOIN we_codes p ON c.parent_id = p.id
      WHERE p.code = $1 AND c.is_active = true
      ORDER BY c.display_order ASC
    `;

        const result = await query(sql, [parentCode]);

        return NextResponse.json({ codes: result.rows });
    } catch (error: any) {
        console.error("Error fetching common codes:", error);
        return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
    }
}
