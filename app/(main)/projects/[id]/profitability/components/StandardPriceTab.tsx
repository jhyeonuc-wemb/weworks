"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import type { ProjectUnitPrice } from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";
import { formatNumber } from "@/lib/utils/format";
import {
  AFFILIATION_GROUPS,
  JOB_GROUPS,
  JOB_LEVELS,
} from "@/constants/master-data";

interface StandardPriceTabProps {
  projectId: number;
  unitPriceYear?: number;
}

export function StandardPriceTab({
  projectId,
  unitPriceYear,
}: StandardPriceTabProps) {
  const [unitPricesByYear, setUnitPricesByYear] = useState<Record<number, ProjectUnitPrice[]>>({});
  const [loading, setLoading] = useState(false);

  const yearsToShow = unitPriceYear ? [unitPriceYear, unitPriceYear - 1, unitPriceYear - 2] : [];

  useEffect(() => {
    const loadUnitPrices = async () => {
      if (!unitPriceYear) return;

      try {
        setLoading(true);
        const results = await Promise.all(
          yearsToShow.map(year => ProfitabilityService.fetchProjectUnitPrices(year))
        );

        const newPricesByYear: Record<number, ProjectUnitPrice[]> = {};
        results.forEach((prices, index) => {
          const year = yearsToShow[index];
          // 정렬
          prices.sort((a, b) => {
            const affA = AFFILIATION_GROUPS.indexOf(a.affiliationGroup as any);
            const affB = AFFILIATION_GROUPS.indexOf(b.affiliationGroup as any);
            if (affA !== affB) return affA - affB;

            const jobGroupA = JOB_GROUPS.indexOf(a.jobGroup as any);
            const jobGroupB = JOB_GROUPS.indexOf(b.jobGroup as any);
            if (jobGroupA !== jobGroupB) return jobGroupA - jobGroupB;

            const levelA = JOB_LEVELS.indexOf(a.jobLevel as any);
            const levelB = JOB_LEVELS.indexOf(b.jobLevel as any);
            if (levelA !== levelB) return levelA - levelB;

            return 0;
          });
          newPricesByYear[year] = prices;
        });

        setUnitPricesByYear(newPricesByYear);
      } catch (error) {
        console.error("Error loading unit prices:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUnitPrices();
  }, [unitPriceYear]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">기준-단가</h2>
          {unitPriceYear ? (
            <p className="mt-1 text-sm text-gray-600">
              프로젝트 시작년도 ({unitPriceYear}년) 기준의 기준단가표를 표시합니다.
            </p>
          ) : (
            <p className="mt-1 text-sm text-red-600">
              프로젝트 계약 시작일이 없습니다. 프로젝트 정보를 수정하여 계약
              시작일을 입력해 주세요.
            </p>
          )}
        </div>
        {unitPriceYear ? (
          <Link
            href="/settings/clients?tab=unit-price-labor"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            기준단가 관리 화면으로 이동 →
          </Link>
        ) : (
          <Link
            href={`/projects/${projectId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            프로젝트 정보 화면으로 이동 →
          </Link>
        )}
      </div>

      {!unitPriceYear ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            프로젝트 시작년도 미설정
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            프로젝트 정보에서 계약 시작일을 입력하면 해당 연도의 기준단가표를
            자동으로 표시합니다.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">기준단가표를 불러오는 중...</p>
        </div>
      ) : Object.keys(unitPricesByYear).length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            기준단가 데이터가 없습니다
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            기준단가표 관리 화면에서 해당 연도의 기준단가를 먼저 등록해 주세요.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              {/* 1행: 공통 정보 및 각 연도 */}
              <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                <th rowSpan={3} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[150px]">
                  소속 및 직군
                </th>
                <th rowSpan={3} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[100px]">
                  직군
                </th>
                <th rowSpan={3} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[100px]">
                  직급
                </th>
                <th rowSpan={3} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[80px]">
                  등급
                </th>
                {yearsToShow.map(year => (
                  <th key={`year-h-${year}`} colSpan={5} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50">
                    {year}년
                  </th>
                ))}
              </tr>
              {/* 2행: 제안단가 및 내부단가 반복 */}
              <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                {yearsToShow.map(year => (
                  <React.Fragment key={`year-subh1-${year}`}>
                    <th colSpan={3} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50">
                      제안단가
                    </th>
                    <th colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50">
                      내부단가
                    </th>
                  </React.Fragment>
                ))}
              </tr>
              {/* 3행: 상세 항목 반복 */}
              <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                {yearsToShow.map(year => (
                  <React.Fragment key={`year-subh2-${year}`}>
                    <th className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[90px]">기준</th>
                    <th className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[90px]">적용</th>
                    <th className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[70px]">할인율</th>
                    <th className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-100 w-[90px]">적용</th>
                    <th className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-gray-50 w-[70px]">인상률</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                // 유니크한 인력 키(소속, 직군, 직급, 등급) 추출 (기준 연도 데이터 중심)
                const basePrices = unitPricesByYear[unitPriceYear!] || [];

                // 그룹화 (평균 계산용)
                const groups: Record<string, {
                  rows: { key: string, label: string, data: Record<number, ProjectUnitPrice | undefined> }[],
                  yearStats: Record<number, {
                    sums: { proposedApplied: number, proposedDiscountRate: number, internalApplied: number, internalIncreaseRate: number },
                    counts: { proposedApplied: number, proposedDiscountRate: number, internalApplied: number, internalIncreaseRate: number }
                  }>
                }> = {};

                // 모든 연도의 유니크한 행 조합 생성
                const uniqueRowKeys = new Set<string>();
                yearsToShow.forEach(year => {
                  (unitPricesByYear[year] || []).forEach(p => {
                    uniqueRowKeys.add(`${p.affiliationGroup}|${p.jobGroup}|${p.jobLevel}|${p.grade}`);
                  });
                });

                const sortedRowKeys = Array.from(uniqueRowKeys).sort((a, b) => {
                  const [affA, jgA, jlA] = a.split('|');
                  const [affB, jgB, jlB] = b.split('|');

                  const affIdxA = AFFILIATION_GROUPS.indexOf(affA as any);
                  const affIdxB = AFFILIATION_GROUPS.indexOf(affB as any);
                  if (affIdxA !== affIdxB) return affIdxA - affIdxB;

                  const jgIdxA = JOB_GROUPS.indexOf(jgA as any);
                  const jgIdxB = JOB_GROUPS.indexOf(jgB as any);
                  if (jgIdxA !== jgIdxB) return jgIdxA - jgIdxB;

                  const jlIdxA = JOB_LEVELS.indexOf(jlA as any);
                  const jlIdxB = JOB_LEVELS.indexOf(jlB as any);
                  return jlIdxA - jlIdxB;
                });

                sortedRowKeys.forEach(key => {
                  const [aff, jg, jl, gr] = key.split('|');
                  if (!groups[aff]) {
                    groups[aff] = { rows: [], yearStats: {} };
                    yearsToShow.forEach(y => {
                      groups[aff].yearStats[y] = {
                        sums: { proposedApplied: 0, proposedDiscountRate: 0, internalApplied: 0, internalIncreaseRate: 0 },
                        counts: { proposedApplied: 0, proposedDiscountRate: 0, internalApplied: 0, internalIncreaseRate: 0 }
                      };
                    });
                  }

                  const rowData: Record<number, ProjectUnitPrice | undefined> = {};
                  yearsToShow.forEach(year => {
                    const price = (unitPricesByYear[year] || []).find(p =>
                      p.affiliationGroup === aff && p.jobGroup === jg && p.jobLevel === jl && p.grade === gr
                    );
                    rowData[year] = price;

                    if (price) {
                      const stats = groups[aff].yearStats[year];
                      if (price.proposedApplied != null) { stats.sums.proposedApplied += price.proposedApplied; stats.counts.proposedApplied++; }
                      if (price.proposedDiscountRate != null) { stats.sums.proposedDiscountRate += price.proposedDiscountRate; stats.counts.proposedDiscountRate++; }
                      if (price.internalApplied != null) { stats.sums.internalApplied += price.internalApplied; stats.counts.internalApplied++; }
                      if (price.internalIncreaseRate != null) { stats.sums.internalIncreaseRate += price.internalIncreaseRate; stats.counts.internalIncreaseRate++; }
                    }
                  });

                  groups[aff].rows.push({ key, label: `${aff}|${jg}|${jl}|${gr}`, data: rowData });
                });

                return Object.entries(groups).map(([groupName, groupData]) => (
                  <React.Fragment key={groupName}>
                    {groupData.rows.map((row) => {
                      const [aff, jg, jl, gr] = row.label.split('|');
                      return (
                        <tr key={row.key} className="h-[35px] hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-300 px-[10px] whitespace-nowrap text-center text-sm text-gray-900">{aff}</td>
                          <td className="border border-gray-300 px-[10px] whitespace-nowrap text-center text-sm text-gray-900">{jg}</td>
                          <td className="border border-gray-300 px-[10px] whitespace-nowrap text-center text-sm text-gray-900">{jl}</td>
                          <td className="border border-gray-300 px-[10px] whitespace-nowrap text-center text-sm text-gray-900">{gr}</td>
                          {yearsToShow.map(year => {
                            const p = row.data[year];
                            return (
                              <React.Fragment key={`${row.key}-${year}`}>
                                <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                                  {p?.proposedStandard != null ? formatNumber(p.proposedStandard) : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                                  {p?.proposedApplied != null ? formatNumber(p.proposedApplied) : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                                  {p?.proposedDiscountRate != null ? `${p.proposedDiscountRate.toFixed(1)}%` : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900 bg-blue-100/30">
                                  {p?.internalApplied != null ? formatNumber(p.internalApplied) : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                                  {p?.internalIncreaseRate != null ? `${p.internalIncreaseRate.toFixed(1)}%` : "-"}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {/* 소계(평균) 행 */}
                    <tr className="h-[35px] font-bold bg-gray-50/50">
                      <td colSpan={4} className="border border-gray-300 px-[10px] text-center text-sm text-gray-700 bg-gray-100/30">
                        {groupName} 평균
                      </td>
                      {yearsToShow.map(year => {
                        const stats = groupData.yearStats[year];
                        return (
                          <React.Fragment key={`sum-${groupName}-${year}`}>
                            <td className="border border-gray-300 px-[10px] bg-gray-100/10"></td>
                            <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                              {stats.counts.proposedApplied > 0 ? formatNumber(stats.sums.proposedApplied / stats.counts.proposedApplied) : "-"}
                            </td>
                            <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                              {stats.counts.proposedDiscountRate > 0 ? `${(stats.sums.proposedDiscountRate / stats.counts.proposedDiscountRate).toFixed(1)}%` : "-"}
                            </td>
                            <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900 bg-blue-100/60">
                              {stats.counts.internalApplied > 0 ? formatNumber(stats.sums.internalApplied / stats.counts.internalApplied) : "-"}
                            </td>
                            <td className="border border-gray-300 px-[10px] whitespace-nowrap text-right text-sm text-gray-900">
                              {stats.counts.internalIncreaseRate > 0 ? `${(stats.sums.internalIncreaseRate / stats.counts.internalIncreaseRate).toFixed(1)}%` : "-"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
