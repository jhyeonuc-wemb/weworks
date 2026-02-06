/**
 * 직급 매핑 유틸리티
 * we_ranks 테이블의 직급명을 기준단가표의 job_level로 매핑
 */

/**
 * we_ranks의 name을 기준단가표의 job_level로 매핑
 * @param rankName we_ranks.name 값
 * @returns 기준단가표의 job_level 값 또는 null
 */
export function mapRankToJobLevel(rankName: string): string | null {
  const mapping: Record<string, string> = {
    '사원': '사원',
    '책임(A)': '책임(M)',  // 책임(A)는 책임(M)으로 매핑
    '책임(M)': '책임(M)',
    '수석(S)': '수석(L)',  // 수석(S)는 수석(L)로 매핑
    '수석(L)': '수석(L)',
    '이사': '이사',
    '상무': '상무',
    '전무': '상무',        // 전무는 상무로 매핑
    '대표이사': '상무',    // 대표이사는 상무로 매핑
  };

  return mapping[rankName] || null;
}

/**
 * 사용자의 기본 등급 결정 (직급 기반)
 * @param rankName we_ranks.name 값
 * @returns 기본 등급 (특급, 고급, 중급, 초급)
 */
export function getDefaultGradeByRank(rankName: string): string {
  const gradeMapping: Record<string, string> = {
    '사원': '초급',
    '책임(A)': '중급',
    '책임(M)': '중급',
    '수석(S)': '고급',
    '수석(L)': '고급',
    '이사': '특급',
    '상무': '특급',
    '전무': '특급',
    '대표이사': '특급',
  };

  return gradeMapping[rankName] || '중급';
}

/**
 * 소속 및 직군 결정 (부서명 기반)
 * @param departmentName 부서명
 * @param title 사용자 직책
 * @returns 소속 및 직군 (위엠비_컨설팅, 위엠비_개발, 외주_컨설팅, 외주_개발)
 */
export function determineAffiliationGroup(
  departmentName: string | null,
  title: string | null
): string {
  if (!departmentName) {
    return '위엠비_개발'; // 기본값
  }

  const deptLower = departmentName.toLowerCase();
  const titleLower = title?.toLowerCase() || '';

  // 외주 관련 키워드 확인
  if (deptLower.includes('외주') || titleLower.includes('외주')) {
    if (deptLower.includes('컨설팅') || titleLower.includes('컨설팅')) {
      return '외주_컨설팅';
    }
    return '외주_개발';
  }

  // 위엠비 내부
  if (deptLower.includes('컨설팅') || titleLower.includes('컨설팅')) {
    return '위엠비_컨설팅';
  }

  // 기본값: 위엠비_개발
  return '위엠비_개발';
}

/**
 * 직군 결정 (부서명 및 역할 기반)
 * @param departmentName 부서명
 * @param role 역할
 * @returns 직군 (컨설팅, 개발, 컨_특, 개_특)
 */
export function determineJobGroup(
  departmentName: string | null,
  role: string | null
): string {
  const deptLower = departmentName?.toLowerCase() || '';
  const roleLower = role?.toLowerCase() || '';

  // 특수 직군 확인
  if (deptLower.includes('특') || roleLower.includes('특')) {
    if (deptLower.includes('컨설팅') || roleLower.includes('컨설팅')) {
      return '컨_특';
    }
    return '개_특';
  }

  // 일반 직군
  if (deptLower.includes('컨설팅') || roleLower.includes('컨설팅')) {
    return '컨설팅';
  }

  // 기본값: 개발
  return '개발';
}
