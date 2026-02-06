import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 초기 클라이언트 데이터 추가
export async function POST(request: NextRequest) {
  try {
    const initialClients = [
      {
        name: '(주)한국남동발전',
        type: 'customer',
        code: 'KEDO',
        description: null,
        contact_person: null,
        contact_email: null,
        contact_phone: null,
      },
      {
        name: '(주)한국전력기술',
        type: 'orderer',
        code: 'KEPCO',
        description: null,
        contact_person: null,
        contact_email: null,
        contact_phone: null,
      },
      {
        name: '(주)한전KDN',
        type: 'customer',
        code: 'KDN',
        description: null,
        contact_person: null,
        contact_email: null,
        contact_phone: null,
      },
    ];

    const results = [];

    for (const client of initialClients) {
      // 중복 체크
      const checkSql = `SELECT id FROM we_clients WHERE name = $1`;
      const checkResult = await query(checkSql, [client.name]);

      if (checkResult.rows.length === 0) {
        const insertSql = `
          INSERT INTO we_clients (
            name, type, code, description, contact_person, contact_email, contact_phone
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) RETURNING id, name, type, code
        `;

        const insertResult = await query(insertSql, [
          client.name,
          client.type,
          client.code,
          client.description,
          client.contact_person,
          client.contact_email,
          client.contact_phone,
        ]);

        results.push({
          action: 'created',
          client: insertResult.rows[0],
        });
      } else {
        results.push({
          action: 'skipped',
          client: { name: client.name, reason: 'Already exists' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Initial clients seeded',
      results,
    });
  } catch (error: any) {
    console.error('Error seeding clients:', error);
    return NextResponse.json(
      { error: 'Failed to seed clients', message: error.message },
      { status: 500 }
    );
  }
}
