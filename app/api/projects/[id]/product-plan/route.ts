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

    const searchParams = request.nextUrl.searchParams;
    const profitabilityId = searchParams.get("profitabilityId");

    console.log("Fetching product plan for project:", projectId, "profitabilityId:", profitabilityId);

    let sql = `SELECT * FROM we_project_product_plan`;
    const dbParams: any[] = [];

    if (profitabilityId) {
      sql += ` WHERE profitability_id = $1`;
      dbParams.push(parseInt(profitabilityId));
    } else {
      sql += ` WHERE project_id = $1 AND profitability_id = (SELECT id FROM we_project_profitability WHERE project_id = $1 ORDER BY version DESC LIMIT 1)`;
      dbParams.push(projectId);
    }

    sql += ` ORDER BY id`;

    const result = await query(sql, dbParams);

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
    const { items, profitabilityId: bodyProfitabilityId } = await request.json();
    const searchParams = request.nextUrl.searchParams;
    let profitabilityId = bodyProfitabilityId || searchParams.get("profitabilityId");

    // profitabilityId 가 없으면 최신 draft/not_started 찾기
    if (!profitabilityId) {
      const draftRes = await query(
        `SELECT id FROM we_project_profitability WHERE project_id = $1 AND status IN ('STANDBY', 'IN_PROGRESS') ORDER BY version DESC LIMIT 1`,
        [projectId]
      );
      if (draftRes.rows.length > 0) {
        profitabilityId = draftRes.rows[0].id;
      }
    }

    if (!profitabilityId) {
      const versionCheck = await query(`SELECT COALESCE(MAX(version), 0) as max_v FROM we_project_profitability WHERE project_id = $1`, [projectId]);
      const newV = versionCheck.rows[0].max_v + 1;
      const insRes = await query(`INSERT INTO we_project_profitability (project_id, version, status, created_by) VALUES ($1, $2, 'STANDBY', 1) RETURNING id`, [projectId, newV]);
      profitabilityId = insRes.rows[0].id;
    }

    // 기존 데이터 삭제
    await query(
      `DELETE FROM we_project_product_plan WHERE profitability_id = $1`,
      [profitabilityId]
    );

    // 새 데이터 삽입
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO we_project_product_plan 
          (project_id, profitability_id, type, product_id, company_name, product_name, quantity, unit_price, 
           base_price, proposal_price, discount_rate, cost_price, request_date, request_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            projectId,
            profitabilityId,
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

    if (profitabilityId) {
      await query(
        `UPDATE we_project_profitability 
         SET status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [profitabilityId]
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
