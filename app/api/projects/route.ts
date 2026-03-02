import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { handleApiError, UnauthorizedError } from '@/lib/core/errors';

// 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const projects = await ProjectService.getProjects({ search, status });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      throw new UnauthorizedError('인증이 필요합니다.');
    }

    const body = await request.json();
    const projectId = await ProjectService.createProject({
      ...body,
      createdBy: user.id
    });

    return NextResponse.json({ id: projectId });
  } catch (error: any) {
    return handleApiError(error);
  }
}

