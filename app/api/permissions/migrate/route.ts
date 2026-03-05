import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // we_permissions 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS we_permissions (
        id          BIGSERIAL PRIMARY KEY,
        menu_key    VARCHAR(100) UNIQUE NOT NULL,
        menu_label  VARCHAR(200) NOT NULL,
        menu_group  VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // we_role_permissions 재생성
    await query(`DROP TABLE IF EXISTS we_role_permissions`);
    await query(`
      CREATE TABLE IF NOT EXISTS we_role_permissions (
        id          BIGSERIAL PRIMARY KEY,
        role_code   VARCHAR(100) NOT NULL,
        menu_key    VARCHAR(100) NOT NULL,
        can_access  BOOLEAN NOT NULL DEFAULT false,
        can_create  BOOLEAN NOT NULL DEFAULT false,
        can_update  BOOLEAN NOT NULL DEFAULT false,
        can_delete  BOOLEAN NOT NULL DEFAULT false,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_code, menu_key)
      )
    `);

    // 메뉴 마스터 seed
    const seedMenus = [
      // 최상위 단독 메뉴 (group='top' → 그룹 헤더 없이 단독 표시)
      ['dashboard', '대시보드', 'top', 10],
      ['sales', '영업/PS', 'top', 20],
      // 프로젝트 그룹 서브메뉴
      ['projects', '프로젝트 현황', '프로젝트', 30],
      ['projects/vrb', 'VRB 현황', '프로젝트', 40],
      ['projects/contract-status', '계약 현황', '프로젝트', 50],
      ['projects/monitoring', '프로젝트 진행 현황', '프로젝트', 55],
      ['projects/profitability', '수지분석서 현황', '프로젝트', 60],
      ['projects/settlement', '수지정산서 현황', '프로젝트', 70],
      // 유지보수 그룹 서브메뉴
      ['maintenance/free', '무상 유지보수 현황', '유지보수', 80],
      ['maintenance/paid', '유상 유지보수 현황', '유지보수', 90],
      // 자원 그룹 서브메뉴
      ['resources/work-logs', '개인별 작업 일지', '자원', 100],
      // 설정 그룹 서브메뉴
      ['settings/clients', '프로젝트 기준정보', '설정', 110],
      ['settings/codes', '공통 코드', '설정', 120],
      ['settings/departments', '부서', '설정', 130],
      ['settings/users', '사용자', '설정', 140],
      ['settings/permissions', '권한', '설정', 150],
      ['settings/difficulty-checklist', '난이도 체크리스트', '설정', 160],
      ['settings/md-estimation', 'M/D 산정 항목', '설정', 170],
      ['settings/holidays', '휴일', '설정', 180],
    ];

    for (const [menu_key, menu_label, menu_group, display_order] of seedMenus) {
      await query(
        `INSERT INTO we_permissions (menu_key, menu_label, menu_group, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (menu_key) DO UPDATE SET
           menu_label = EXCLUDED.menu_label,
           menu_group = EXCLUDED.menu_group,
           display_order = EXCLUDED.display_order`,
        [menu_key, menu_label, menu_group, display_order]
      );
    }

    return NextResponse.json({ success: true, message: '권한 테이블 마이그레이션 완료' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
