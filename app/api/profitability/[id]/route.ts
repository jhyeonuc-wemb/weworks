import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// 수지분석서 단일 삭제
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `DELETE FROM we_project_profitability WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Profitability not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting profitability:", error);
    return NextResponse.json(
      {
        error: "Failed to delete profitability",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

