"use client";

import { useState, useEffect } from "react";
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
  const [unitPrices, setUnitPrices] = useState<ProjectUnitPrice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUnitPrices = async () => {
      if (!unitPriceYear) return;

      try {
        setLoading(true);
        const prices = await ProfitabilityService.fetchProjectUnitPrices(
          unitPriceYear
        );

        // 정렬
        prices.sort((a, b) => {
          const affA = AFFILIATION_GROUPS.indexOf(
            a.affiliationGroup as any
          );
          const affB = AFFILIATION_GROUPS.indexOf(
            b.affiliationGroup as any
          );
          if (affA !== affB) return affA - affB;

          const jobGroupA = JOB_GROUPS.indexOf(a.jobGroup as any);
          const jobGroupB = JOB_GROUPS.indexOf(b.jobGroup as any);
          if (jobGroupA !== jobGroupB) return jobGroupA - jobGroupB;

          const levelA = JOB_LEVELS.indexOf(a.jobLevel as any);
          const levelB = JOB_LEVELS.indexOf(b.jobLevel as any);
          if (levelA !== levelB) return levelA - levelB;

          return 0;
        });

        setUnitPrices(prices);
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
      ) : unitPrices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            기준단가 데이터가 없습니다
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            기준단가표 관리 화면에서 해당 연도의 기준단가를 먼저 등록해 주세요.
          </p>
          <Link
            href="/settings/unit-prices"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            기준단가 관리 화면으로 이동 →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  소속 및 직군
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  직군
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  직급
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  등급
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium uppercase tracking-wider text-gray-500">
                  제안단가 기준(천원)
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium uppercase tracking-wider text-gray-500">
                  제안단가 적용(천원)
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium uppercase tracking-wider text-blue-700 bg-blue-50">
                  내부단가 적용(천원)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {unitPrices.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {p.affiliationGroup}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {p.jobGroup}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {p.jobLevel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {p.grade}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                    {p.proposedStandard !== null
                      ? formatNumber(p.proposedStandard)
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                    {p.proposedApplied !== null
                      ? formatNumber(p.proposedApplied)
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-blue-600 bg-blue-50">
                    {p.internalApplied !== null
                      ? formatNumber(p.internalApplied)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
