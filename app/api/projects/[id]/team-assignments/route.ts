import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 프로젝트 인력 할당 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    const sql = `
      SELECT 
        ta.id,
        ta.project_id,
        ta.user_id,
        ta.role,
        ta.affiliation_group,
        ta.job_group,
        ta.grade,
        ta.start_date,
        ta.end_date,
        ta.allocation_percentage,
        ta.status,
        ta.created_at,
        ta.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.title as user_title,
        r.name as rank_name,
        r.code as rank_code,
        d.name as department_name
      FROM we_project_team_assignments ta
      LEFT JOIN we_users u ON ta.user_id = u.id
      LEFT JOIN we_ranks r ON u.rank_id = r.id
      LEFT JOIN we_departments d ON u.department_id = d.id
      WHERE ta.project_id = $1
      ORDER BY ta.start_date DESC, u.name
    `;

    const result = await query(sql, [projectId]);

    return NextResponse.json({
      assignments: result.rows.map((row: any) => ({
        id: parseInt(row.id, 10),
        projectId: parseInt(row.project_id, 10),
        userId: parseInt(row.user_id, 10),
        userName: row.user_name,
        userEmail: row.user_email,
        userTitle: row.user_title,
        rankName: row.rank_name,
        rankCode: row.rank_code,
        departmentName: row.department_name,
        role: row.role,
        affiliationGroup: row.affiliation_group,
        jobGroup: row.job_group,
        grade: row.grade,
        startDate: row.start_date,
        endDate: row.end_date,
        allocationPercentage: parseInt(row.allocation_percentage, 10),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching team assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team assignments', message: error.message },
      { status: 500 }
    );
  }
}

// 프로젝트 인력 할당 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;
    const body = await request.json();

    const {
      userId,
      role,
      affiliationGroup,
      jobGroup,
      grade,
      startDate,
      endDate,
      allocationPercentage = 100,
      status = 'active',
    } = body;

    if (!userId || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, startDate' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO we_project_team_assignments (
        project_id,
        user_id,
        role,
        affiliation_group,
        job_group,
        grade,
        start_date,
        end_date,
        allocation_percentage,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(sql, [
      projectId,
      userId,
      role || null,
      affiliationGroup || null,
      jobGroup || null,
      grade || null,
      startDate,
      endDate || null,
      allocationPercentage,
      status,
    ]);

    const row = result.rows[0];

    return NextResponse.json({
      assignment: {
        id: parseInt(row.id, 10),
        projectId: parseInt(row.project_id, 10),
        userId: parseInt(row.user_id, 10),
        role: row.role,
        affiliationGroup: row.affiliation_group,
        jobGroup: row.job_group,
        grade: row.grade,
        startDate: row.start_date,
        endDate: row.end_date,
        allocationPercentage: parseInt(row.allocation_percentage, 10),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create team assignment', message: error.message },
      { status: 500 }
    );
  }
}
