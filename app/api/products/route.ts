import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 제품/상품 마스터 목록 조회 및 생성

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    let sql = `
      SELECT
        id,
        company_name,
        product_name,
        unit_price,
        is_active,
        created_at,
        updated_at
      FROM we_products
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (company_name ILIKE $${params.length + 1} OR product_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      sql += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === "true");
    }

    sql += ` ORDER BY company_name, product_name`;

    const result = await query(sql, params);

    return NextResponse.json({
      products: result.rows.map((row: any) => ({
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
      })),
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, productName, unitPrice, isActive = true } = body;

    if (!companyName || !productName) {
      return NextResponse.json(
        { error: "Missing required fields: companyName, productName" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO we_products (
        company_name,
        product_name,
        unit_price,
        is_active
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(sql, [
      companyName,
      productName,
      unitPrice ?? 0,
      isActive,
    ]);
    const row = result.rows[0];

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product", message: error.message },
      { status: 500 }
    );
  }
}

