/**
 * 기준단가표 유틸리티 함수
 * 수지분석서 및 정산서에서 기준단가를 조회하는 헬퍼 함수
 */

export interface UnitPrice {
  id: number;
  affiliationGroup: string;
  jobGroup: string;
  jobLevel: string;
  grade: string;
  year: number;
  proposedStandard: number | null;
  proposedApplied: number | null;
  proposedDiscountRate: number | null;
  internalApplied: number | null;
  internalIncreaseRate: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitPriceQuery {
  affiliationGroup?: string;
  jobGroup?: string;
  jobLevel?: string;
  grade?: string;
  year?: number;
  isActive?: boolean;
}

/**
 * 기준단가표 조회
 * @param query 조회 조건
 * @returns 기준단가표 배열
 */
export async function fetchUnitPrices(query: UnitPriceQuery = {}): Promise<UnitPrice[]> {
  try {
    const params = new URLSearchParams();
    
    if (query.year) {
      params.append('year', query.year.toString());
    }
    if (query.affiliationGroup) {
      params.append('affiliationGroup', query.affiliationGroup);
    }
    if (query.isActive !== undefined) {
      params.append('isActive', query.isActive.toString());
    }

    const url = `/api/unit-prices${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch unit prices');
    }

    const data = await response.json();
    let prices = data.unitPrices || [];

    // 추가 필터링 (서버에서 지원하지 않는 필터)
    if (query.jobGroup) {
      prices = prices.filter((p: UnitPrice) => p.jobGroup === query.jobGroup);
    }
    if (query.jobLevel) {
      prices = prices.filter((p: UnitPrice) => p.jobLevel === query.jobLevel);
    }
    if (query.grade) {
      prices = prices.filter((p: UnitPrice) => p.grade === query.grade);
    }

    return prices;
  } catch (error) {
    console.error('Error fetching unit prices:', error);
    return [];
  }
}

/**
 * 특정 조건의 기준단가 조회 (단일)
 * @param query 조회 조건
 * @returns 기준단가 또는 null
 */
export async function getUnitPrice(query: UnitPriceQuery): Promise<UnitPrice | null> {
  const prices = await fetchUnitPrices(query);
  return prices.length > 0 ? prices[0] : null;
}

/**
 * 제안단가 조회
 * @param affiliationGroup 소속 및 직군
 * @param jobGroup 직군
 * @param jobLevel 직급
 * @param grade 등급
 * @param year 연도
 * @returns 제안단가 적용값 (없으면 기준값, 둘 다 없으면 null)
 */
export async function getProposedPrice(
  affiliationGroup: string,
  jobGroup: string,
  jobLevel: string,
  grade: string,
  year: number
): Promise<number | null> {
  const price = await getUnitPrice({
    affiliationGroup,
    jobGroup,
    jobLevel,
    grade,
    year,
  });

  if (!price) {
    return null;
  }

  return price.proposedApplied ?? price.proposedStandard ?? null;
}

/**
 * 내부단가 조회
 * @param affiliationGroup 소속 및 직군
 * @param jobGroup 직군
 * @param jobLevel 직급
 * @param grade 등급
 * @param year 연도
 * @returns 내부단가 적용값 (없으면 null)
 */
export async function getInternalPrice(
  affiliationGroup: string,
  jobGroup: string,
  jobLevel: string,
  grade: string,
  year: number
): Promise<number | null> {
  const price = await getUnitPrice({
    affiliationGroup,
    jobGroup,
    jobLevel,
    grade,
    year,
  });

  return price?.internalApplied ?? null;
}

/**
 * 기준단가표를 연도별로 그룹화
 * @param prices 기준단가표 배열
 * @returns 연도별로 그룹화된 객체
 */
export function groupByYear(prices: UnitPrice[]): Record<number, UnitPrice[]> {
  return prices.reduce((acc, price) => {
    if (!acc[price.year]) {
      acc[price.year] = [];
    }
    acc[price.year].push(price);
    return acc;
  }, {} as Record<number, UnitPrice[]>);
}

/**
 * 기준단가표를 소속별로 그룹화
 * @param prices 기준단가표 배열
 * @returns 소속별로 그룹화된 객체
 */
export function groupByAffiliation(prices: UnitPrice[]): Record<string, UnitPrice[]> {
  return prices.reduce((acc, price) => {
    if (!acc[price.affiliationGroup]) {
      acc[price.affiliationGroup] = [];
    }
    acc[price.affiliationGroup].push(price);
    return acc;
  }, {} as Record<string, UnitPrice[]>);
}

/**
 * 소속별 평균 내부단가 계산
 * @param prices 기준단가표 배열
 * @param affiliationGroup 소속 및 직군
 * @param year 연도
 * @returns 평균 내부단가
 */
export function calculateAverageInternalPrice(
  prices: UnitPrice[],
  affiliationGroup: string,
  year: number
): number {
  const filtered = prices.filter(
    (p) => p.affiliationGroup === affiliationGroup && p.year === year && p.internalApplied !== null
  );

  if (filtered.length === 0) {
    return 0;
  }

  const sum = filtered.reduce((acc, p) => acc + (p.internalApplied || 0), 0);
  return sum / filtered.length;
}
