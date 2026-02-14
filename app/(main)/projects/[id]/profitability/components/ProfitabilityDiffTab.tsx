"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import {
  formatCurrency,
  type Currency
} from "@/lib/utils/currency";
import { calculateProfitabilitySummary } from "@/lib/utils/calculations";
import type {
  ManpowerPlanItem,
  ProductPlanItem,
  ProjectExpenseItem
} from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";

interface ProfitabilityDiffTabProps {
  projectId: number;
  manpowerItems: ManpowerPlanItem[];
  productItems: ProductPlanItem[];
  expenseItems: ProjectExpenseItem[];
  currency: Currency;
  isReadOnly?: boolean;
  onSave?: () => void;
  refreshAllData?: () => void;
  profitabilityId?: number;
}

export function ProfitabilityDiffTab({
  projectId,
  manpowerItems = [],
  productItems = [],
  expenseItems = [],
  currency,
  isReadOnly = false,
  onSave,
  refreshAllData,
  profitabilityId,
}: ProfitabilityDiffTabProps) {
  // --- 부가 수익/비용 수동 입력 상태 ---
  const [extraRevenue, setExtraRevenue] = React.useState(0);
  const [extraRevenueDesc, setExtraRevenueDesc] = React.useState("");
  const [extraExpense, setExtraExpense] = React.useState(0);
  const [extraExpenseDesc, setExtraExpenseDesc] = React.useState("");
  const [saving, setSaving] = useState(false);

  // --- 초기 데이터 로드 ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ProfitabilityService.fetchProfitabilityDiff(projectId, profitabilityId);
        setExtraRevenue(data.extraRevenue || 0);
        setExtraRevenueDesc(data.extraRevenueDesc || "");
        setExtraExpense(data.extraExpense || 0);
        setExtraExpenseDesc(data.extraExpenseDesc || "");
      } catch (error) {
        console.error("Error loading profitability diff data:", error);
      }
    };
    loadData();
  }, [projectId, profitabilityId]);

  // --- 최근 공유된 요약 계산 로직 사용 ---
  const summary = useMemo(() => {
    return calculateProfitabilitySummary(
      manpowerItems,
      productItems,
      expenseItems,
      extraRevenue,
      extraExpense
    );
  }, [manpowerItems, productItems, expenseItems, extraRevenue, extraExpense]);

  // UI용 별칭들
  const srvSum = summary.srv;
  const prdSum = summary.prd;

  const revenue = {
    serviceInternal: srvSum.internal.proposal,
    serviceExternal: srvSum.external.proposal,
    serviceTotal: srvSum.total.proposal,
    productInternal: prdSum.internal.proposal,
    productExternal: prdSum.external.proposal,
    productTotal: prdSum.total.proposal,
    grandTotal: summary.totalRevenue
  };

  const servicePL = {
    costInternal: srvSum.internal.cost,
    costExternal: srvSum.external.cost,
    delayCostInternal: srvSum.internal.delay,
    delayCostExternal: srvSum.external.delay,
    profitInternal: srvSum.internal.proposal - (srvSum.internal.cost + srvSum.internal.delay + srvSum.internal.special + srvSum.internal.general),
    profitExternal: srvSum.external.proposal - (srvSum.external.cost + srvSum.external.delay),
    expGeneral: srvSum.internal.general,
    expSpecial: srvSum.internal.special,
    expTotal: srvSum.internal.general + srvSum.internal.special,
    totalProfit: srvSum.total.profit,
  };

  const productPL = {
    costInternal: prdSum.internal.cost,
    costExternal: prdSum.external.cost,
    profitInternal: prdSum.internal.proposal - prdSum.internal.cost,
    profitExternal: prdSum.external.proposal - prdSum.external.cost,
    totalProfit: prdSum.total.profit,
  };

  const projectProfitTotal = summary.coreProfit;
  const businessPL = { totalProfit: summary.coreProfit };
  const extraProfitTotal = extraRevenue - extraExpense;
  const companyProfitTotal = summary.netProfit;

  // --- 저장 핸들러 ---
  const handleSave = async () => {
    try {
      setSaving(true);
      await ProfitabilityService.saveProfitabilityDiff(projectId, {
        extraRevenue,
        extraRevenueDesc,
        extraExpense,
        extraExpenseDesc,
        totalRevenue: summary.totalRevenue,
        totalCost: summary.totalCost,
        netProfit: summary.netProfit,
        profitRate: summary.profitRate,
      }, profitabilityId);
      alert("데이터가 성공적으로 저장되었습니다.");
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving profitability diff data:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (val: number) => formatCurrency(val, currency, false);
  const fmtRate = (val: number) => (val * 100).toFixed(2) + "%";
  const calcRate = (part: number, total: number) => total === 0 ? "0.00%" : ((part / total) * 100).toFixed(2) + "%";
  const getClr = (val: number) => val < 0 ? "text-red-500" : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">수지 분석표</h2>
          <p className="mt-1 text-sm text-gray-600">
            프로젝트의 수주 금액, 원가, 경비를 종합하여 최종 손익을 분석합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">(단위:천원)</span>
          {!isReadOnly && (
            <>
              {refreshAllData && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('모든 탭(매출, 원가, 경비)의 최신 데이터를 불러와 수지분석표를 갱신하시겠습니까?')) {
                      refreshAllData();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 h-10 text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  title="데이터 갱신"
                >
                  <RefreshCw className="h-4 w-4" />
                  데이터 갱신
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="min-w-full border-collapse" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-gray-900 border-b-2 border-gray-400 h-[42px]">
              <th colSpan={4} className="border border-gray-300 px-4 text-center text-sm font-bold bg-blue-50/50">구 분</th>
              <th className="border border-gray-300 px-2 text-center text-sm font-bold bg-blue-50/50 min-w-[80px]">금액</th>
              <th className="border border-gray-300 px-2 text-center text-sm font-bold bg-blue-50/50 min-w-[120px]">지표</th>
              <th className="border border-gray-300 px-4 text-center text-sm font-bold bg-blue-50/50 min-w-[200px]">금액 설명</th>
              <th className="border border-gray-300 px-4 text-center text-sm font-bold bg-blue-50/50 min-w-[200px]">지표 설명</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="h-[42px]">
              <td rowSpan={23} className="border border-gray-300 px-2 text-center font-bold text-gray-900 w-[100px] bg-gray-50/50">프로젝트</td>
              <td rowSpan={7} className="border border-gray-300 px-2 text-center font-bold text-gray-900 w-[70px]">수주</td>
              <td rowSpan={3} className="border border-gray-300 px-2 text-center text-gray-700 w-[90px]">용역</td>
              <td className="border border-gray-300 px-4 text-left text-gray-900">당사</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(revenue.serviceInternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4 text-gray-600">당사계약금액, 부가세 제외</td>
              <td className="border border-gray-300 px-4 text-left text-gray-600">당사 평균 단가</td>
            </tr>
            <tr className="h-[42px]">
              <td className="border border-gray-300 px-4 text-left text-gray-900">외주</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(revenue.serviceExternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4 text-gray-600">당사계약금액, 부가세 제외</td>
              <td className="border border-gray-300 px-4 text-left text-gray-600">외주 평균 단가</td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">용역소계</td>
              <td className="border border-gray-300 px-2 text-right font-bold text-gray-900">{fmt(revenue.serviceTotal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm font-normal">평균단가</td>
            </tr>
            <tr className="h-[42px]">
              <td rowSpan={3} className="border border-gray-300 px-2 text-center text-gray-700">제품</td>
              <td className="border border-gray-300 px-4 text-left text-gray-900">당사제품</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(revenue.productInternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4 text-gray-600">당사계약금액, 부가세 제외</td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px]">
              <td className="border border-gray-300 px-4 text-left text-gray-900">타사상품</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(revenue.productExternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4 text-gray-600">타사계약금액, 부가세 제외</td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">제품소계</td>
              <td className="border border-gray-300 px-2 text-right font-bold text-gray-900">{fmt(revenue.productTotal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px] bg-gray-100 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 text-left font-bold text-gray-900">수주 합계</td>
              <td className="border border-gray-300 px-2 text-right text-gray-900">{fmt(revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-2 text-right text-blue-600">{fmt(revenue.grandTotal * 1.1)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-blue-600 text-sm italic font-normal">부가가치세 제외된 가격</td>
            </tr>

            <tr className="h-[42px]">
              <td rowSpan={10} className="border border-gray-300 px-1 text-center font-bold text-gray-900 w-[70px] leading-tight text-sm">용역<br />손익</td>
              <td rowSpan={3} className="border border-gray-300 px-2 text-center text-gray-700">당사</td>
              <td className="border border-gray-300 px-4 text-left text-gray-700">당사 원가 (<span className="text-red-500 font-bold">-</span>)</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.costInternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">당사 평균 원가(내부가격)</td>
            </tr>
            <tr className="h-[42px]">
              <td className="border border-gray-300 px-4 text-left text-gray-700">지연 비용</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.delayCostInternal)}</td>
              <td className="border border-gray-300 px-2 text-right bg-blue-50/30 text-blue-700 font-bold">0.00%</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">SM 계약인 경우에는 0%, 기타는 10% 적용</td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">손익 소계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.profitInternal)}`}>{fmt(servicePL.profitInternal)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.profitInternal)}`}>{calcRate(servicePL.profitInternal, revenue.serviceInternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px]">
              <td rowSpan={3} className="border border-gray-300 px-2 text-center text-gray-700">외주</td>
              <td className="border border-gray-300 px-4 text-left text-gray-700">외주 원가 (<span className="text-red-500 font-bold">-</span>)</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.costExternal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">외주 평균 조달 원가</td>
            </tr>
            <tr className="h-[42px]">
              <td className="border border-gray-300 px-4 text-left text-gray-700">지연 비용</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.delayCostExternal)}</td>
              <td className="border border-gray-300 px-2 text-right bg-blue-50/30 text-blue-700 font-bold">0.00%</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">SM 계약인 경우에는 0%, 기타는 10% 적용</td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">손익 소계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.profitExternal)}`}>{fmt(servicePL.profitExternal)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.profitExternal)}`}>{calcRate(servicePL.profitExternal, revenue.serviceExternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px]">
              <td rowSpan={3} className="border border-gray-300 px-1 text-center text-gray-700 leading-tight text-sm">
                <span>Project<br />경비</span>
              </td>
              <td className="border border-gray-300 px-4 text-left text-gray-700">일반 경비</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.expGeneral)}</td>
              <td className="border border-gray-300 px-2 text-right text-gray-700">{calcRate(servicePL.expGeneral, revenue.serviceTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px]">
              <td className="border border-gray-300 px-4 text-left text-gray-700">특별 경비</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(servicePL.expSpecial)}</td>
              <td className="border border-gray-300 px-2 text-right text-gray-700">{calcRate(servicePL.expSpecial, revenue.serviceTotal)}</td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">Wokshop비용, 임차비, 교통비 등</td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80 font-bold">
              <td className="border border-gray-300 px-4 text-left font-bold">경비 소계</td>
              <td className="border border-gray-300 px-2 text-right text-gray-900">{fmt(servicePL.expTotal)}</td>
              <td className="border border-gray-300 px-2 text-right bg-blue-50/30 text-blue-700">{calcRate(servicePL.expTotal, revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-sm font-normal">경비 소계 / 수주 합계</td>
            </tr>
            <tr className="h-[42px] bg-gray-100 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 text-left font-bold">용역 손익 합계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.totalProfit)}`}>{fmt(servicePL.totalProfit)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(servicePL.totalProfit)}`}>{calcRate(servicePL.totalProfit, revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-sm font-normal">용역 손익 합계 / 수주 합계</td>
            </tr>

            <tr className="h-[42px]">
              <td rowSpan={5} className="border border-gray-300 px-1 text-center font-bold text-gray-900 w-[70px] leading-tight text-sm">제품<br />손익</td>
              <td rowSpan={2} className="border border-gray-300 px-2 text-center text-gray-700">당사</td>
              <td className="border border-gray-300 px-4 text-left text-gray-700">제품 원가</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(productPL.costInternal)}</td>
              <td className="border border-gray-300 px-2 text-right text-gray-700">{calcRate(productPL.costInternal, revenue.productInternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">제품원가 비율</td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">손익 소계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.profitInternal)}`}>{fmt(productPL.profitInternal)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.profitInternal)}`}>{calcRate(productPL.profitInternal, revenue.productInternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">당사제품 손익 / 당사제품 수주금액</td>
            </tr>
            <tr className="h-[42px]">
              <td rowSpan={2} className="border border-gray-300 px-2 text-center text-gray-700">타사</td>
              <td className="border border-gray-300 px-4 text-left text-gray-700">상품 원가</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(productPL.costExternal)}</td>
              <td className="border border-gray-300 px-2 text-right text-gray-700">{calcRate(productPL.costExternal, revenue.productExternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">제품원가 비율</td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80">
              <td className="border border-gray-300 px-4 text-left font-bold">손익 소계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.profitExternal)}`}>{fmt(productPL.profitExternal)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.profitExternal)}`}>{calcRate(productPL.profitExternal, revenue.productExternal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-gray-600 text-sm">타사상품 손익 / 타사상품 수주금액</td>
            </tr>
            <tr className="h-[42px] bg-gray-100 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 text-left font-bold text-gray-900">제품 손익 합계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.totalProfit)}`}>{fmt(productPL.totalProfit)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(productPL.totalProfit)}`}>{calcRate(productPL.totalProfit, revenue.productTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm font-normal">제품손익 / 제품수주금액</td>
            </tr>

            <tr className="h-[42px] bg-gray-200 font-bold border-b-2 border-gray-400">
              <td colSpan={3} className="border border-gray-300 px-4 text-left text-gray-900 font-bold">프로젝트 손익 합계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(projectProfitTotal)}`}>{fmt(projectProfitTotal)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(projectProfitTotal)}`}>{calcRate(projectProfitTotal, revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm font-normal">수주합계 / 프로젝트 수익</td>
            </tr>

            <tr className="h-[42px]">
              <td rowSpan={7} className="border border-gray-300 px-2 text-center font-bold text-gray-900 w-[100px] bg-gray-50/50">손익합계</td>
              <td rowSpan={3} className="border border-gray-300 px-1 text-center font-bold text-gray-900 w-[70px] leading-tight text-sm">사업<br />손익</td>
              <td colSpan={2} className="border border-gray-300 px-4 text-left text-gray-700">당사 제품 원가 (+)</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900">{fmt(0)}</td>
              <td className="border border-gray-300 px-2 text-right text-gray-700">{calcRate(0, revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm">제품원가 비율</td>
            </tr>
            <tr className="h-[42px]">
              <td colSpan={2} className="border border-gray-300 px-4 text-left text-gray-700">경상비용</td>
              <td className="border border-gray-300 px-2 text-right font-medium text-gray-900"></td>
              <td className="border border-gray-300 px-2 text-right bg-blue-50/30 text-blue-700 font-bold">0.00%</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm">매출액 18%</td>
            </tr>
            <tr className="h-[42px] bg-gray-100 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 text-left font-bold text-gray-900">사업 손익 합계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(businessPL.totalProfit)}`}>{fmt(businessPL.totalProfit)}</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(businessPL.totalProfit)}`}>{calcRate(businessPL.totalProfit, revenue.grandTotal)}</td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4 text-left text-gray-600 text-sm font-normal">사업손익 / 수주합계</td>
            </tr>

            <tr className="h-[42px]">
              <td rowSpan={3} className="border border-gray-300 px-1 text-center font-bold text-gray-900 w-[70px] leading-tight text-sm">부가<br />수익</td>
              <td colSpan={2} className="border border-gray-300 px-4 text-left text-gray-700">부가 예상 수익 (+)</td>
              <td className="border border-gray-300 px-1 text-right font-medium text-gray-900">
                <input
                  type="text"
                  value={extraRevenue === 0 ? "0" : extraRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/[^0-9-]/g, "")) || 0;
                    setExtraRevenue(val);
                  }}
                  disabled={isReadOnly}
                  className="w-full bg-transparent px-1 text-right outline-none focus:bg-blue-50/50"
                />
              </td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-1">
                <input
                  type="text"
                  value={extraRevenueDesc}
                  onChange={(e) => setExtraRevenueDesc(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-transparent px-2 text-left text-sm outline-none focus:bg-blue-50/50"
                />
              </td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px]">
              <td colSpan={2} className="border border-gray-300 px-4 text-left text-gray-700">부가 예상 비용 (<span className="text-red-500 font-bold">-</span>)</td>
              <td className="border border-gray-300 px-1 text-right font-medium text-gray-900">
                <input
                  type="text"
                  value={extraExpense === 0 ? "0" : extraExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/[^0-9-]/g, "")) || 0;
                    setExtraExpense(val);
                  }}
                  disabled={isReadOnly}
                  className="w-full bg-transparent px-1 text-right outline-none focus:bg-blue-50/50"
                />
              </td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-1">
                <input
                  type="text"
                  value={extraExpenseDesc}
                  onChange={(e) => setExtraExpenseDesc(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-transparent px-2 text-left text-sm outline-none focus:bg-blue-50/50"
                />
              </td>
              <td className="border border-gray-300 px-4"></td>
            </tr>
            <tr className="h-[42px] bg-gray-50/80 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 text-left font-bold text-gray-900 font-bold">부가 수익 합계</td>
              <td className={`border border-gray-300 px-2 text-right font-bold ${getClr(extraProfitTotal)}`}>{fmt(extraProfitTotal)}</td>
              <td className="border border-gray-300 px-2 bg-gray-50/30"></td>
              <td className="border border-gray-300 px-4"></td>
              <td className="border border-gray-300 px-4"></td>
            </tr>

            <tr className="h-[52px] bg-slate-800 text-white font-bold text-lg">
              <td colSpan={3} className="border border-slate-700 px-4 text-left text-white font-bold">회사 손익 합계</td>
              <td className={`border border-slate-700 px-2 text-right font-bold ${companyProfitTotal < 0 ? 'text-red-400' : 'text-white'}`}>{fmt(companyProfitTotal)}</td>
              <td className={`border border-slate-700 px-2 text-right font-bold ${companyProfitTotal < 0 ? 'text-red-400' : 'text-blue-300'}`}>{calcRate(companyProfitTotal, revenue.grandTotal)}</td>
              <td className="border border-slate-700 px-4"></td>
              <td className="border border-slate-700 px-4 text-sm font-normal text-gray-300 text-left">회사수익합계 / 수주합계</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <span className="font-bold">※ 참고:</span>
          수익 분석표의 모든 금액은 인력 계획, 제품 계획, 프로젝트 경비의 데이터를 기반으로 자동 계산됩니다.
        </p>
      </div>
    </div>
  );
}
