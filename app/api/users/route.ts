import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 사용자 목록 조회 (PM, 영업대표 등)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    let sql = `
      WITH RECURSIVE dept_tree AS (
        SELECT id, name, parent_department_id, display_order, 
               CAST(LPAD(COALESCE(display_order, 0)::text, 5, '0') || '_' || name AS text) as path
        FROM we_departments
        WHERE parent_department_id IS NULL
        UNION ALL
        SELECT d.id, d.name, d.parent_department_id, d.display_order,
               dt.path || ' > ' || LPAD(COALESCE(d.display_order, 0)::text, 5, '0') || '_' || d.name
        FROM we_departments d
        JOIN dept_tree dt ON d.parent_department_id = dt.id
      )
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
        dt.name as department_name,
        dt.path as dept_path,
        u.role_id,
        (SELECT r.name FROM we_codes r WHERE r.id = u.role_id) as role_name,
        u.rank_id,
        rk.name as rank_name,
        rk.code as rank_code,
        rk.display_order as rank_order,
        u.status,
        u.phone,
        u.address,
        u.address_detail,
        u.postcode,
        u.user_state,
        u.contract_type,
        u.joined_date,
        u.resignation_date,
        u.must_change_password,
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
      LEFT JOIN dept_tree dt ON u.department_id = dt.id
      LEFT JOIN we_user_roles ur ON u.id = ur.user_id
      LEFT JOIN we_codes r2 ON ur.role_id = r2.id
      LEFT JOIN we_codes rk ON u.rank_id = rk.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (role) {
      sql += ` AND EXISTS (
        SELECT 1 FROM we_user_roles ur2
        JOIN we_codes r3 ON ur2.role_id = r3.id
        WHERE ur2.user_id = u.id AND r3.name = $${params.length + 1}
      )`;
      params.push(role);
    }

    sql += ` GROUP BY u.id, dt.name, dt.path, rk.name, rk.code, rk.display_order
      ORDER BY 
        COALESCE(dt.path, 'ZZZZZ') ASC, 
        (CASE WHEN u.title IS NOT NULL AND u.title <> '' THEN 0 ELSE 1 END) ASC,
        COALESCE(rk.display_order, 999) ASC, 
        u.title ASC,
        u.name ASC`;

    const result = await query(sql, params);

    return NextResponse.json({
      users: result.rows.map((row: any) => ({
        ...row,
        roles: row.roles || []
      }))
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 500 }
    );
  }
}

// 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      name,
      email,
      password,
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

    if (!name || !email || !username) {
      return NextResponse.json(
        { error: '이름, 이메일, 아이디는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const emailCheck = await query(
      'SELECT id FROM we_users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.', field: 'email' },
        { status: 400 }
      );
    }

    // 아이디 중복 확인
    const usernameCheck = await query(
      'SELECT id FROM we_users WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 등록된 아이디입니다.', field: 'username' },
        { status: 400 }
      );
    }

    // 비밀번호는 초기값으로 username과 동일하게 설정 (나중에 해시화 필요)
    const passwordHash = password || username;

    const sql = `
      INSERT INTO we_users (
        username, name, email, password_hash, employee_number, phone,
        department_id, role_id, rank_id, grade, title, status, joined_date, 
        resignation_date, address, address_detail, postcode, user_state, contract_type, must_change_password
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, username, name, email, employee_number, phone, department_id, role_id, rank_id, grade, title, status, joined_date, resignation_date, address, address_detail, postcode, user_state, contract_type, must_change_password
    `;

    const result = await query(sql, [
      username,
      name,
      email,
      passwordHash, // 임시: 나중에 해시화 필요
      employee_number || null,
      phone || null,
      department_id || null,
      role_id || null, // 호환성을 위해 유지
      rank_id || null,
      body.grade || null,
      title || null,
      status || 'active',
      joined_date || null,
      resignation_date || null,
      address || null,
      address_detail || null,
      postcode || null,
      user_state || null,
      contract_type || null,
      must_change_password !== undefined ? must_change_password : true,
    ]);

    const userId = result.rows[0].id;

    // 여러 역할 저장
    const rolesToSave = role_ids && Array.isArray(role_ids) ? role_ids : (role_id ? [role_id] : []);
    if (rolesToSave.length > 0) {
      // 기존 역할 삭제
      await query('DELETE FROM we_user_roles WHERE user_id = $1', [userId]);

      // 새 역할 추가
      for (let i = 0; i < rolesToSave.length; i++) {
        const rid = rolesToSave[i];
        const isPrimary = i === 0; // 첫 번째 역할을 주요 역할로 설정
        await query(
          'INSERT INTO we_user_roles (user_id, role_id, is_primary) VALUES ($1, $2, $3)',
          [userId, rid, isPrimary]
        );
      }

      // 주요 역할을 we_users.role_id에도 저장 (호환성)
      if (rolesToSave.length > 0) {
        await query('UPDATE we_users SET role_id = $1 WHERE id = $2', [rolesToSave[0], userId]);
      }
    }

    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: '사용자 생성에 실패했습니다.', message: error.message },
      { status: 500 }
    );
  }
}
