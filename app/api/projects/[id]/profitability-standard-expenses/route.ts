import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// 프로젝트별 기준-경비 값 조회
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);

    const result = await query(
      `
        SELECT 
          row_id,
          calculated_value,
          final_amount
        FROM we_project_profitability_standard_expenses
        WHERE project_id = $1
        ORDER BY row_id
      `,
      [projectId]
    );

    return NextResponse.json({
      items: result.rows.map((row: any) => ({
        rowId: Number(row.row_id),
        calculatedValue:
          row.calculated_value !== null && row.calculated_value !== undefined
            ? Number(row.calculated_value)
            : null,
        finalAmount:
          row.final_amount !== null && row.final_amount !== undefined
            ? Number(row.final_amount)
            : null,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching profitability standard expenses:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch profitability standard expenses",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// 프로젝트별 기준-경비 값 저장 (upsert)
export async function PUT(request: NextRequest, { params }: Params) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    const body = await request.json();

    const items: Array<{
      rowId: number;
      calculatedValue: number | null;
      finalAmount: number | null;
    }> = body.items || [];

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items must be an array" },
        { status: 400 }
      );
    }

    // 유효한 rowId(1~9)만 남기기
    const validItems = items.filter(
      (item) =>
        typeof item.rowId === "number" &&
        item.rowId >= 1 &&
        item.rowId <= 9
    );

    // 트랜잭션 처리
    await query("BEGIN");

    for (const item of validItems) {
      await query(
        `
          INSERT INTO we_project_profitability_standard_expenses (
            project_id,
            row_id,
            calculated_value,
            final_amount
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (project_id, row_id)
          DO UPDATE SET
            calculated_value = EXCLUDED.calculated_value,
            final_amount = EXCLUDED.final_amount,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          projectId,
          item.rowId,
          item.calculatedValue,
          item.finalAmount,
        ]
      );
    }

    await query("COMMIT");

    // 수지분석서 상태 업데이트 ('not_started' -> 'in_progress')
    // 수지분석서 상태 업데이트 ('not_started' -> 'in_progress') 또는 신규 생성
    const checkRes = await query(
      `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress', 'STANDBY', 'IN_PROGRESS')`,
      [projectId]
    );

    if (checkRes.rows.length > 0) {
      await query(
        `UPDATE we_project_profitability 
         SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP 
         WHERE project_id = $1 AND status IN ('not_started', 'STANDBY')`,
        [projectId]
      );
    } else {
      // 진행 중인 건이 없으면 새로 생성
      const versionCheck = await query(
        `SELECT MAX(version) AS max_version FROM we_project_profitability WHERE project_id = $1 AND status = 'completed'`,
        [projectId]
      );
      const newVersion = Number(versionCheck.rows[0]?.max_version || 0) + 1;

      await query(
        `INSERT INTO we_project_profitability (
          project_id, version, status, created_by
        ) VALUES ($1, $2, 'IN_PROGRESS', $3)`,
        [projectId, newVersion, user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving profitability standard expenses:", error);
    await query("ROLLBACK").catch((rollbackError) => {
      console.error("Rollback error:", rollbackError);
    });
    return NextResponse.json(
      {
        error: "Failed to save profitability standard expenses",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

