"use client";

import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";

interface SummaryTabProps {
  projectName: string;
  customerName: string;
  projectCode: string;
  currency: Currency;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitRate: number;
  ourMm: number;
  othersMm: number;
}

export function SummaryTab({
  projectName,
  customerName,
  projectCode,
  currency,
  totalRevenue,
  totalCost,
  netProfit,
  profitRate,
  ourMm,
  othersMm,
}: SummaryTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">요약</h2>
        <p className="mt-1 text-sm text-gray-600">
          수지분석서의 주요 지표를 요약하여 표시합니다.
        </p>
      </div>

      {/* 프로젝트 기본 정보 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <BarChart3 className="h-5 w-5" />
          프로젝트 정보
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">프로젝트명</p>
            <p className="mt-1 text-base text-gray-900">{projectName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">고객사</p>
            <p className="mt-1 text-base text-gray-900">{customerName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">프로젝트 코드</p>
            <p className="mt-1 text-base text-gray-900">{projectCode}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">통화</p>
            <p className="mt-1 text-base text-gray-900">{currency}</p>
          </div>
        </div>
      </div>

      {/* 수익성 요약 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">수주 합계</p>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 text-right">
            {formatCurrency(totalRevenue * 1000, currency)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">손익</p>
            <TrendingUp
              className={`h-5 w-5 ${netProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
            />
          </div>
          <p
            className={`mt-2 text-3xl font-bold text-right ${netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
          >
            {formatCurrency(netProfit * 1000, currency)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">수익률</p>
            <BarChart3
              className={`h-5 w-5 ${profitRate >= 0 ? "text-green-500" : "text-red-500"
                }`}
            />
          </div>
          <p
            className={`mt-2 text-3xl font-bold text-right ${profitRate >= 0 ? "text-green-600" : "text-red-600"
              }`}
          >
            {formatPercent(profitRate)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">당사</p>
            <BarChart3 className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 text-right">
            {(ourMm || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M/M
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">타사</p>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 text-right">
            {(othersMm || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M/M
          </p>
        </div>
      </div>
    </div>
  );
}
