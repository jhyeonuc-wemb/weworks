import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 코드 목록 조회 (전체 또는 특정 부모 하위)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');
        const parentCode = searchParams.get('parentCode');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        let sql = `
      SELECT 
        c1.id,
        c1.parent_id,
        c1.code,
        c1.name,
        c1.description,
        c1.display_order,
        c1.is_active,
        c1.is_system,
        c1.created_at,
        c1.updated_at
      FROM we_codes c1
    `;

        const conditions = [];
        const params: any[] = [];

        if (parentCode) {
            sql += ' LEFT JOIN we_codes c2 ON c1.parent_id = c2.id';
            conditions.push('c2.code = $1');
            params.push(parentCode);
        } else if (parentId !== null) {
            if (parentId === 'null') {
                conditions.push('c1.parent_id IS NULL');
            } else {
                conditions.push('c1.parent_id = $1');
                params.push(parseInt(parentId));
            }
        }

        if (!includeInactive) {
            conditions.push('c1.is_active = true');
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY c1.display_order ASC, c1.name ASC';

        const result = await query(sql, params);

        return NextResponse.json({ codes: result.rows });
    } catch (error: any) {
        console.error('Error fetching codes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch codes', message: error.message },
            { status: 500 }
        );
    }
}

// 신규 코드 등록
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { parent_id, code, name, description, display_order, is_active } = data;

        if (!code || !name) {
            return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 });
        }

        // 중복 체크
        const checkSql = `
      SELECT id FROM we_codes 
      WHERE code = $1 AND (parent_id = $2 OR (parent_id IS NULL AND $2 IS NULL))
    `;
        const checkResult = await query(checkSql, [code, parent_id || null]);
        if (checkResult.rows.length > 0) {
            return NextResponse.json({ error: 'Code already exists in this level' }, { status: 400 });
        }

        const sql = `
      INSERT INTO we_codes (
        parent_id, code, name, description, display_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const result = await query(sql, [
            parent_id || null,
            code,
            name,
            description || '',
            display_order || 0,
            is_active !== undefined ? is_active : true
        ]);

        return NextResponse.json({ code: result.rows[0] });
    } catch (error: any) {
        console.error('Error creating code:', error);
        return NextResponse.json(
            { error: 'Failed to create code', message: error.message },
            { status: 500 }
        );
    }
}
