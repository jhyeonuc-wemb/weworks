import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 고객사/발주처 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    let sql = `
      SELECT 
        id,
        name,
        type,
        code,
        description,
        contact_person,
        contact_email,
        contact_phone
      FROM we_clients
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND name ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    if (type) {
      sql += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    sql += ` ORDER BY name`;

    const result = await query(sql, params);

    return NextResponse.json({ clients: result.rows });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', message: error.message },
      { status: 500 }
    );
  }
}

// 고객사/발주처 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      code,
      description,
      contact_person,
      contact_email,
      contact_phone,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // 코드 자동 생성: 제공된 코드가 없으면 자동 생성
    let generatedCode = code;
    if (!generatedCode) {
      // 이름에서 영문자만 추출하여 약어 생성
      const englishChars = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if (englishChars.length >= 2) {
        // 영문자가 2개 이상이면 앞 4자리 사용
        generatedCode = englishChars.substring(0, 4);
      } else {
        // 영문자가 부족하면 순차 번호 사용
        const countResult = await query(
          'SELECT COUNT(*) as count FROM we_clients WHERE code LIKE $1',
          ['CLIENT-%']
        );
        const count = parseInt(countResult.rows[0]?.count || '0', 10);
        generatedCode = `CLIENT-${String(count + 1).padStart(3, '0')}`;
      }
      
      // 중복 체크: 같은 코드가 이미 있으면 순차 번호 추가
      let finalCode = generatedCode;
      let counter = 1;
      while (true) {
        const checkResult = await query(
          'SELECT id FROM we_clients WHERE code = $1',
          [finalCode]
        );
        if (checkResult.rows.length === 0) {
          break;
        }
        finalCode = `${generatedCode}-${counter}`;
        counter++;
      }
      generatedCode = finalCode;
    }

    const sql = `
      INSERT INTO we_clients (
        name, type, code, description, contact_person, contact_email, contact_phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING id, name, type, code, description, contact_person, contact_email, contact_phone
    `;

    const result = await query(sql, [
      name,
      type,
      generatedCode,
      description || null,
      contact_person || null,
      contact_email || null,
      contact_phone || null,
    ]);

    return NextResponse.json({ client: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client', message: error.message },
      { status: 500 }
    );
  }
}
