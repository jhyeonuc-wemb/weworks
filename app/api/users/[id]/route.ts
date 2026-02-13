import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 사용자 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `
      SELECT 
        u.id,
        u.username,
        u.name,
        u.email,
        u.employee_number,
        u.position,
        u.title,
        u.grade,
        u.department_id,
        d.name as department_name,
        u.must_change_password,
        u.role_id,
        (SELECT r.name FROM we_codes r WHERE r.id = u.role_id) as role_name,
        u.rank_id,
        rk.name as rank_name,
        u.status,
        u.phone,
        u.address,
        u.address_detail,
        u.postcode,
        u.user_state,
        u.contract_type,
        u.joined_date,
        u.resignation_date,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ur.role_id,
              'name', r2.name,
              'is_primary', ur.is_primary
            ) ORDER BY ur.is_primary DESC, r2.name
          ) FILTER (WHERE ur.role_id IS NOT NULL),
          '[]'::json
        ) as roles
      FROM we_users u
      LEFT JOIN we_departments d ON u.department_id = d.id
      LEFT JOIN we_user_roles ur ON u.id = ur.user_id
      LEFT JOIN we_codes r2 ON ur.role_id = r2.id
      LEFT JOIN we_codes rk ON u.rank_id = rk.id
      WHERE u.id = $1
      GROUP BY u.id, d.name, rk.id, rk.name
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...result.rows[0],
        roles: result.rows[0].roles || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', message: error.message },
      { status: 500 }
    );
  }
}

// 사용자 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      username,
      name,
      email,
      employee_number,
      phone,
      department_id,
      role_id, // 단일 역할 (호환성)
      role_ids, // 여러 역할 (배열)
      rank_id,
      title,
      status,
      address,
      address_detail,
      postcode,
      user_state,
      contract_type,
      joined_date,
      resignation_date,
      must_change_password,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE we_users
      SET 
        name = $1,
        email = $2,
        employee_number = $3,
        phone = $4,
        department_id = $5,
        role_id = $6,
        rank_id = $7,
        grade = $8,
        title = $9,
        status = $10,
        address = $11,
        address_detail = $12,
        postcode = $13,
        user_state = $14,
        contract_type = $15,
        joined_date = $16,
        resignation_date = $17,
        must_change_password = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING id, username, name, email, employee_number, phone, department_id, role_id, rank_id, grade, title, status, address, address_detail, postcode, user_state, contract_type, joined_date, resignation_date, must_change_password
    `;

    const result = await query(sql, [
      name,
      email,
      employee_number || null,
      phone || null,
      department_id || null,
      role_id || null, // 호환성을 위해 유지
      rank_id || null,
      body.grade || null,
      title || null,
      status || 'active',
      address || null,
      address_detail || null,
      postcode || null,
      user_state || null,
      contract_type || null,
      joined_date || null,
      resignation_date || null,
      must_change_password !== undefined ? must_change_password : false,
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 여러 역할 저장
    const rolesToSave = role_ids && Array.isArray(role_ids) ? role_ids : (role_id ? [role_id] : []);
    if (rolesToSave.length > 0) {
      // 기존 역할 삭제
      await query('DELETE FROM we_user_roles WHERE user_id = $1', [id]);

      // 새 역할 추가
      for (let i = 0; i < rolesToSave.length; i++) {
        const rid = rolesToSave[i];
        const isPrimary = i === 0; // 첫 번째 역할을 주요 역할로 설정
        await query(
          'INSERT INTO we_user_roles (user_id, role_id, is_primary) VALUES ($1, $2, $3)',
          [id, rid, isPrimary]
        );
      }

      // 주요 역할을 we_users.role_id에도 저장 (호환성)
      await query('UPDATE we_users SET role_id = $1 WHERE id = $2', [rolesToSave[0], id]);
    } else {
      // 역할이 없으면 we_user_roles도 삭제하고 role_id도 null로 설정
      await query('DELETE FROM we_user_roles WHERE user_id = $1', [id]);
      await query('UPDATE we_users SET role_id = NULL WHERE id = $1', [id]);
    }

    // 업데이트된 사용자 정보 다시 조회
    const updatedResult = await query(`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.email,
        u.employee_number,
        u.position,
        u.title,
        u.grade,
        u.department_id,
        d.name as department_name,
        u.must_change_password,
        u.role_id,
        (SELECT r.name FROM we_codes r WHERE r.id = u.role_id) as role_name,
        u.rank_id,
        rk.name as rank_name,
        u.status,
        u.phone,
        u.address,
        u.address_detail,
        u.joined_date,
        u.resignation_date,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ur.role_id,
              'name', r2.name,
              'is_primary', ur.is_primary
            ) ORDER BY ur.is_primary DESC, r2.name
          ) FILTER (WHERE ur.role_id IS NOT NULL),
          '[]'::json
        ) as roles
      FROM we_users u
      LEFT JOIN we_departments d ON u.department_id = d.id
      LEFT JOIN we_user_roles ur ON u.id = ur.user_id
      LEFT JOIN we_codes r2 ON ur.role_id = r2.id
      LEFT JOIN we_codes rk ON u.rank_id = rk.id
      WHERE u.id = $1
      GROUP BY u.id, d.name, rk.id, rk.name
    `, [id]);

    return NextResponse.json({
      user: {
        ...updatedResult.rows[0],
        roles: updatedResult.rows[0].roles || []
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', message: error.message },
      { status: 500 }
    );
  }
}

// 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `DELETE FROM we_users WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', message: error.message },
      { status: 500 }
    );
  }
}
