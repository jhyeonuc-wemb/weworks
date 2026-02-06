import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: 프로젝트별 제품 계획 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    console.log("Fetching product plan for project:", projectId);

    const result = await query(
      `SELECT * FROM we_project_product_plan WHERE project_id = $1 ORDER BY id`,
      [projectId]
    );

    const rows = result.rows || [];
    console.log("Product plan rows fetched:", rows.length);

    // snake_case를 camelCase로 변환 (소수점 제거, %는 유지)
    const items = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      productId: row.product_id,
      companyName: row.company_name,
      productName: row.product_name,
      quantity: row.quantity ? Math.round(Number(row.quantity)) : null,
      unitPrice: row.unit_price ? Math.round(Number(row.unit_price)) : null,
      basePrice: row.base_price ? Math.round(Number(row.base_price)) : 0,
      proposalPrice: row.proposal_price ? Math.round(Number(row.proposal_price)) : null,
      discountRate: row.discount_rate ? Number(row.discount_rate) : 0, // % 값은 소수점 유지
      costPrice: row.cost_price ? Math.round(Number(row.cost_price)) : null,
      requestDate: row.request_date || "",
      requestType: row.request_type || "",
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error fetching product plan:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { error: "제품 계획 조회에 실패했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

// PUT: 프로젝트별 제품 계획 저장
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const { items } = await request.json();

    // 기존 데이터 삭제
    await query(
      `DELETE FROM we_project_product_plan WHERE project_id = $1`,
      [projectId]
    );

    // 새 데이터 삽입
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO we_project_product_plan 
          (project_id, type, product_id, company_name, product_name, quantity, unit_price, 
           base_price, proposal_price, discount_rate, cost_price, request_date, request_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            projectId,
            item.type,
            item.productId || null,
            item.companyName || "",
            item.productName || "",
            item.quantity || 0,
            item.unitPrice || null,
            item.basePrice || 0,
            item.proposalPrice || null,
            item.discountRate || 0,
            item.costPrice || null,
            item.requestDate || null,
            item.requestType || "",
          ]
        );
      }
    }

    // 수지분석서 상태 업데이트 ('not_started' -> 'in_progress') 또는 신규 생성
    const checkRes = await query(
      `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('not_started', 'in_progress')`,
      [projectId]
    );

    if (checkRes.rows.length > 0) {
      await query(
        `UPDATE we_project_profitability 
         SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
         WHERE project_id = $1 AND status = 'not_started'`,
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
        ) VALUES ($1, $2, 'in_progress', 1)`,
        [projectId, newVersion]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving product plan:", error);
    return NextResponse.json(
      { error: "제품 계획 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
