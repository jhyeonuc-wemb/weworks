import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// 수지분석서 상태 업데이트 (작성완료 등)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, written_date } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    await query(
      `UPDATE we_project_profitability
       SET status = $1,
           written_date = COALESCE($2::date, written_date),
           updated_at = NOW()
       WHERE id = $3`,
      [status, written_date ?? null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating profitability status:", error);
    return NextResponse.json(
      { error: "Failed to update profitability", message: error.message },
      { status: 500 }
    );
  }
}

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

