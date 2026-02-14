import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// 제품/상품 단일 조회
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT * FROM we_products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    return NextResponse.json({
      product: {
        id: Number(row.id),
        companyName: row.company_name,
        productName: row.product_name,
        unitPrice:
          row.unit_price !== null && row.unit_price !== undefined
            ? Number(row.unit_price)
            : 0,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product", message: error.message },
      { status: 500 }
    );
  }
}

// 제품/상품 수정
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      companyName,
      productName,
      unitPrice,
      isActive,
    } = body;

    const existing = await query(
      `SELECT * FROM we_products WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE we_products
      SET
        company_name = $1,
        product_name = $2,
        unit_price = $3,
        is_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await query(sql, [
      companyName ?? existing.rows[0].company_name,
      productName ?? existing.rows[0].product_name,
      unitPrice ?? existing.rows[0].unit_price,
      isActive ?? existing.rows[0].is_active,
      id,
    ]);

    const row = result.rows[0];

    return NextResponse.json({
      product: {
        id: Number(row.id),
        companyName: row.company_name,
        productName: row.product_name,
        unitPrice:
          row.unit_price !== null && row.unit_price !== undefined
            ? Number(row.unit_price)
            : 0,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product", message: error.message },
      { status: 500 }
    );
  }
}

// 제품/상품 삭제
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `DELETE FROM we_products WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product", message: error.message },
      { status: 500 }
    );
  }
}

