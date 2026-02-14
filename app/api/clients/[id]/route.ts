import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 고객사/발주처 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `
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
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client', message: error.message },
      { status: 500 }
    );
  }
}

// 고객사/발주처 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const sql = `
      UPDATE we_clients
      SET 
        name = $1,
        type = $2,
        code = $3,
        description = $4,
        contact_person = $5,
        contact_email = $6,
        contact_phone = $7
      WHERE id = $8
      RETURNING id, name, type, code, description, contact_person, contact_email, contact_phone
    `;

    const result = await query(sql, [
      name,
      type,
      code || null,
      description || null,
      contact_person || null,
      contact_email || null,
      contact_phone || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client', message: error.message },
      { status: 500 }
    );
  }
}

// 고객사/발주처 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `DELETE FROM we_clients WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client', message: error.message },
      { status: 500 }
    );
  }
}
