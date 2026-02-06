import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const result = await query(`
            SELECT 
                s.*,
                p.project_code,
                p.name as project_name,
                c.name as customer_name
            FROM we_project_settlement s
            LEFT JOIN we_projects p ON s.project_id = p.id
            LEFT JOIN we_clients c ON p.customer_id = c.id
            ORDER BY s.created_at DESC
        `);

        return NextResponse.json({
            settlements: result.rows,
        });
    } catch (error) {
        console.error("Error fetching settlements:", error);
        return NextResponse.json(
            { error: "Failed to fetch settlements" },
            { status: 500 }
        );
    }
}
