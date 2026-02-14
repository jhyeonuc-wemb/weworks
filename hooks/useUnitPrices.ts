// 기준단가 관리 커스텀 훅

import { useState, useEffect, useMemo, useCallback } from "react";
import type { UnitPrice, GroupAverage } from "@/types/unit-price";
import { UnitPriceService } from "@/services/unit-price.service";
import {
  AFFILIATION_GROUPS,
  JOB_GROUPS,
  JOB_LEVELS,
  GRADES,
} from "@/constants/master-data";

export function useUnitPrices() {
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterAffiliation, setFilterAffiliation] = useState<string>("");

  // 데이터 로드
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await UnitPriceService.fetchList();
      setUnitPrices(data);
    } catch (error) {
      console.error("Failed to fetch unit prices:", error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링 및 정렬 (useMemo로 최적화)
  const filteredPrices = useMemo(() => {
    let filtered = unitPrices;

    // 검색
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (price) =>
          price.affiliationGroup.toLowerCase().includes(query) ||
          price.jobGroup.toLowerCase().includes(query) ||
          price.jobLevel.toLowerCase().includes(query) ||
          price.grade.toLowerCase().includes(query)
      );
    }

    // 연도 필터
    if (filterYear) {
      filtered = filtered.filter(
        (price) => price.year === parseInt(filterYear, 10)
      );
    }

    // 소속 필터
    if (filterAffiliation) {
      filtered = filtered.filter(
        (price) => price.affiliationGroup === filterAffiliation
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      const orderA = AFFILIATION_GROUPS.indexOf(a.affiliationGroup as any);
      const orderB = AFFILIATION_GROUPS.indexOf(b.affiliationGroup as any);
      if (orderA !== orderB) return orderA - orderB;

      const jobGroupA = JOB_GROUPS.indexOf(a.jobGroup as any);
      const jobGroupB = JOB_GROUPS.indexOf(b.jobGroup as any);
      if (jobGroupA !== jobGroupB) return jobGroupA - jobGroupB;

      const levelA = JOB_LEVELS.indexOf(a.jobLevel as any);
      const levelB = JOB_LEVELS.indexOf(b.jobLevel as any);
      if (levelA !== levelB) return levelA - levelB;

      return GRADES.indexOf(a.grade as any) - GRADES.indexOf(b.grade as any);
    });

    return filtered;
  }, [unitPrices, searchQuery, filterYear, filterAffiliation]);

  // 소속 그룹별 평균 계산
  const groupAverages = useMemo(() => {
    return calculateGroupAverages(filteredPrices, unitPrices);
  }, [filteredPrices, unitPrices]);

  // 생성
  const createUnitPrice = useCallback(
    async (data: Omit<UnitPrice, "id" | "createdAt" | "updatedAt">) => {
      try {
        await UnitPriceService.create(data as any);
        await fetchData();
      } catch (error) {
        console.error("Failed to create unit price:", error);
        throw error;
      }
    },
    []
  );

  // 수정
  const updateUnitPrice = useCallback(
    async (id: number, data: Partial<UnitPrice>) => {
      try {
        await UnitPriceService.update(id, data as any);
        await fetchData();
      } catch (error) {
        console.error("Failed to update unit price:", error);
        throw error;
      }
    },
    []
  );

  // 삭제
  const deleteUnitPrice = useCallback(async (id: number) => {
    try {
      await UnitPriceService.delete(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete unit price:", error);
      throw error;
    }
  }, []);

  // 연도 복사
  const copyYear = useCallback(
    async (sourceYear: number, targetYear: number) => {
      try {
        await UnitPriceService.copyYear(sourceYear, targetYear);
        await fetchData();
      } catch (error) {
        console.error("Failed to copy year:", error);
        throw error;
      }
    },
    []
  );

  return {
    unitPrices,
    filteredPrices,
    groupAverages,
    loading,
    searchQuery,
    setSearchQuery,
    filterYear,
    setFilterYear,
    filterAffiliation,
    setFilterAffiliation,
    createUnitPrice,
    updateUnitPrice,
    deleteUnitPrice,
    copyYear,
    refetch: fetchData,
  };
}

// 그룹별 평균 계산 헬퍼 함수
function calculateGroupAverages(
  filteredPrices: UnitPrice[],
  allPrices: UnitPrice[]
): GroupAverage[] {
  const groups = new Map<string, UnitPrice[]>();

  filteredPrices.forEach((price) => {
    if (!groups.has(price.affiliationGroup)) {
      groups.set(price.affiliationGroup, []);
    }
    groups.get(price.affiliationGroup)!.push(price);
  });

  const averages: GroupAverage[] = [];

  groups.forEach((prices, affiliationGroup) => {
    if (prices.length === 0) return;

    const sumProposedApplied = prices.reduce(
      (sum, p) => sum + (p.proposedApplied || 0),
      0
    );
    const sumProposedDiscountRate = prices.reduce(
      (sum, p) => sum + (p.proposedDiscountRate || 0),
      0
    );
    const sumInternalApplied = prices.reduce(
      (sum, p) => sum + (p.internalApplied || 0),
      0
    );

    const avgProposedApplied = Math.round(sumProposedApplied / prices.length);
    const avgProposedDiscountRate = sumProposedDiscountRate / prices.length;
    const avgInternalApplied = Math.round(sumInternalApplied / prices.length);

    // 전년도 그룹 평균과 비교
    const currentYear = prices[0]?.year;
    const prevYearPrices = allPrices.filter(
      (p) =>
        p.affiliationGroup === affiliationGroup && p.year === currentYear - 1
    );

    let avgIncreaseRate: number | null = null;
    if (prevYearPrices.length > 0) {
      const prevAvg =
        prevYearPrices.reduce((sum, p) => sum + (p.internalApplied || 0), 0) /
        prevYearPrices.length;
      if (prevAvg > 0) {
        avgIncreaseRate = ((avgInternalApplied - prevAvg) / prevAvg) * 100;
      }
    }

    averages.push({
      affiliationGroup,
      averageProposedApplied: avgProposedApplied,
      averageProposedDiscountRate: avgProposedDiscountRate,
      averageInternalApplied: avgInternalApplied,
      averageIncreaseRate: avgIncreaseRate,
    });
  });

  return averages;
}
