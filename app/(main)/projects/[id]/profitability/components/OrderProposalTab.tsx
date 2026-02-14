"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, type Currency } from "@/lib/utils/currency";
import { DatePicker, Button, Input, Textarea, Badge } from "@/components/ui";
import { calculateProfitabilitySummary } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";
import type {
  ManpowerPlanItem,
  ProductPlanItem,
  ProjectExpenseItem
} from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";

interface OrderProposalTabProps {
  project: any;
  manpowerItems: ManpowerPlanItem[];
  productItems: ProductPlanItem[];
  expenseItems: ProjectExpenseItem[];
  currency: Currency;
  isReadOnly?: boolean;
  onSave?: () => void;
  profitabilityId?: number;
}

export function OrderProposalTab({
  project,
  manpowerItems = [],
  productItems = [],
  expenseItems = [],
  currency,
  isReadOnly = false,
  onSave,
  profitabilityId,
}: OrderProposalTabProps) {
  // --- 수주품의 수동 입력 상태 ---
  const [contractType, setContractType] = useState("");
  const [contractCategory, setContractCategory] = useState("");
  const [mainContract, setMainContract] = useState("");
  const [mainOperator, setMainOperator] = useState("");
  const [executionLocation, setExecutionLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [risk, setRisk] = useState("");
  const [writtenDate, setWrittenDate] = useState("");
  const [approvedDate, setApprovedDate] = useState("");

  // 대금 조건 (선급금, 1차, 2차, 잔금)
  const [paymentTerms, setPaymentTerms] = useState({
    labor: [
      { rate: "", timing: "" },
      { rate: "", timing: "" },
      { rate: "", timing: "" },
      { rate: "", timing: "" }
    ],
    product: [
      { rate: "", timing: "" },
      { rate: "", timing: "" },
      { rate: "", timing: "" },
      { rate: "", timing: "" }
    ]
  });

  // 협력 업체
  const [partners, setPartners] = useState<any[]>([
    { name: "", role: "", manager: "", contact: "", remarks: "" }
  ]);

  // 수지차 부가 수익/비용 데이터 (계산 일관성용)
  const [extraData, setExtraData] = useState({ extraRevenue: 0, extraExpense: 0 });

  const [saving, setSaving] = useState(false);

  // --- 초기 데이터 로드 ---
  useEffect(() => {
    const loadData = async () => {
      if (!project?.id) return;
      try {
        const data = await ProfitabilityService.fetchOrderProposal(project.id, profitabilityId);
        setContractType(data.contractType || "");
        setContractCategory(data.contractCategory || "");
        setMainContract(data.mainContract || "");
        setMainOperator(data.mainOperator || "");
        setExecutionLocation(data.executionLocation || "");
        setOverview(data.overview || "");
        setSpecialNotes(data.specialNotes || "");
        setRisk(data.risk || "");
        if (data.paymentTerms) {
          const merged = {
            labor: [...(data.paymentTerms.labor || [])],
            product: [...(data.paymentTerms.product || [])]
          };
          while (merged.labor.length < 4) merged.labor.push({ rate: "", timing: "" });
          while (merged.product.length < 4) merged.product.push({ rate: "", timing: "" });
          setPaymentTerms(merged);
        }
        if (data.partners && data.partners.length > 0) setPartners(data.partners);
        setWrittenDate(data.writtenDate ? data.writtenDate.split("T")[0] : "");
        setApprovedDate(data.approvedDate ? data.approvedDate.split("T")[0] : "");

        // 수지차 데이터도 불러와서 손익 계산에 반영
        try {
          const diffData = await ProfitabilityService.fetchProfitabilityDiff(project.id, profitabilityId);
          setExtraData({
            extraRevenue: diffData.extraRevenue || 0,
            extraExpense: diffData.extraExpense || 0
          });
        } catch (e) {
          console.error("Error fetching extra data for summary:", e);
        }
      } catch (error) {
        console.error("Error loading order proposal data:", error);
      }
    };
    loadData();
  }, [project?.id, profitabilityId]);

  // --- 수지표 요약 계산 (Profitability Summary) ---
  const summary = useMemo(() => {
    return calculateProfitabilitySummary(
      manpowerItems,
      productItems,
      expenseItems,
      extraData.extraRevenue,
      extraData.extraExpense
    );
  }, [manpowerItems, productItems, expenseItems, extraData]);

  // UI용 소계들 (srv, prd)
  const srvSum = summary.srv;
  const prdSum = summary.prd;

  const handleSave = async () => {
    try {
      setSaving(true);
      await ProfitabilityService.saveOrderProposal(project.id, {
        contractType,
        contractCategory,
        mainContract,
        mainOperator,
        executionLocation,
        overview,
        specialNotes,
        risk,
        paymentTerms,
        partners,
        writtenDate,
        approvedDate,
        // 요약 정보 추가 저장
        totalRevenue: summary.totalRevenue,
        totalCost: summary.totalCost,
        netProfit: summary.netProfit,
        profitRate: summary.profitRate
      }, profitabilityId);
      alert("수주품의 데이터가 저장되었습니다.");
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving order proposal:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (val: number) => formatCurrency(val, currency, false);
  const calcRate = (part: number, total: number) => total === 0 ? "0.00%" : ((part / total) * 100).toFixed(2) + "%";
  const getClr = (val: number) => val < 0 ? "text-red-500" : "";

  const formatDateStr = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).split("T")[0];
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return String(dateStr).split("T")[0];
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 상단 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">수주품의</h2>
          <p className="mt-1 text-sm text-gray-500">프로젝트 수주를 위한 최종 내부 품의 정보를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-4">
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 leading-normal whitespace-nowrap">작성일</span>
              <DatePicker
                date={writtenDate ? new Date(writtenDate) : undefined}
                setDate={(date) => setWrittenDate(date ? format(date, "yyyy-MM-dd") : "")}
                disabled={isReadOnly}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 leading-normal whitespace-nowrap">승인일</span>
              <DatePicker
                date={approvedDate ? new Date(approvedDate) : undefined}
                setDate={(date) => setApprovedDate(date ? format(date, "yyyy-MM-dd") : "")}
                disabled={isReadOnly}
                className="w-36"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 1. 프로젝트 개요 */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 italic flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          Project Overview
        </h3>
        <div className="border border-gray-300">
          <table className="w-full border-collapse text-sm table-fixed">
            <colgroup>
              <col className="w-[9.375%]" />
              <col className="w-[15.625%]" />
              <col className="w-[9.375%]" />
              <col className="w-[15.625%]" />
              <col className="w-[9.375%]" />
              <col className="w-[15.625%]" />
              <col className="w-[9.375%]" />
              <col className="w-[15.625%]" />
            </colgroup>
            <tbody>
              {/* 1행: 고객명(1-T) | Value(2-4 D) | 계약형태(5-T) | [Input(6-D)] | 주사업자(7-T) | [Input(8-D)] */}
              <tr className="h-10 border-b border-gray-300">
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700">고객명</th>
                <td colSpan={3} className="px-3 border-r border-gray-300 text-left bg-white">{project?.customerName}</td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">계약형태</th>
                <td className="border-r border-gray-300 px-2 text-left bg-white">
                  <input type="text" value={contractType} onChange={e => setContractType(e.target.value)} disabled={isReadOnly} className="w-full h-full bg-transparent outline-none focus:bg-primary/5 px-2 text-left text-sm font-bold transition-all duration-300" />
                </td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">주사업자</th>
                <td className="px-2 text-left bg-white">
                  <input type="text" value={mainOperator} onChange={e => setMainOperator(e.target.value)} disabled={isReadOnly} className="w-full h-full bg-transparent outline-none focus:bg-primary/5 px-2 text-left text-sm font-bold transition-all duration-300" />
                </td>
              </tr>
              {/* 2행: 프로젝트명(1-T) | Value(2-4 D) | 계약유형(5-T) | [Input(6-D)] | 기타(7-T) | [Input(8-D)] */}
              <tr className="h-10 border-b border-gray-300">
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700">프로젝트명</th>
                <td colSpan={3} className="px-3 border-r border-gray-300 text-left bg-white">{project?.name}</td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">계약유형</th>
                <td className="border-r border-gray-300 px-2 text-left bg-white">
                  <input type="text" value={contractCategory} onChange={e => setContractCategory(e.target.value)} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 text-left text-sm" />
                </td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">기타</th>
                <td className="px-2 text-left bg-white">
                  <input type="text" value={mainContract} onChange={e => setMainContract(e.target.value)} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 text-left text-sm" />
                </td>
              </tr>
              {/* 3행: PM명(1-T) | Value(2-D) | 기간(3-T) | Value(4-D) | 수행장소(5-T) | [Input(6-8 D)] */}
              <tr className="h-10 border-b border-gray-300">
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700">PM명</th>
                <td className="px-3 border-r border-gray-300 text-left bg-white">{project?.managerName}</td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">기간</th>
                <td className="px-3 border-r border-gray-300 text-left bg-white text-sm whitespace-nowrap overflow-hidden text-ellipsis">{formatDateStr(project?.contractStartDate)} ~ {formatDateStr(project?.contractEndDate)}</td>
                <th className="bg-gray-50 border-r border-gray-300 px-2 text-center font-bold text-gray-700 text-sm">수행장소</th>
                <td colSpan={3} className="px-3 text-left bg-white">
                  <input type="text" value={executionLocation} onChange={e => setExecutionLocation(e.target.value)} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 text-left overflow-hidden text-ellipsis whitespace-nowrap text-sm" />
                </td>
              </tr>

              <tr className="border-b border-gray-300">
                <th className="bg-gray-50 border-r border-gray-300 px-2 py-3 text-center font-bold text-gray-700">개요</th>
                <td colSpan={7} className="px-3 py-1">
                  <textarea value={overview} onChange={e => setOverview(e.target.value)} disabled={isReadOnly} rows={5} className="w-full h-full bg-transparent outline-none resize-none focus:bg-primary/5 p-3 text-sm font-medium transition-all duration-300" />
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <th className="bg-gray-50 border-r border-gray-300 px-2 py-3 text-center font-bold text-gray-700">특이사항</th>
                <td colSpan={7} className="px-3 py-1">
                  <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} disabled={isReadOnly} rows={4} className="w-full h-full bg-transparent outline-none resize-none focus:bg-primary/5 p-3 text-sm font-medium transition-all duration-300" />
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 border-r border-gray-300 px-2 py-3 text-center font-bold text-gray-700">Risk</th>
                <td colSpan={7} className="px-3 py-1">
                  <textarea value={risk} onChange={e => setRisk(e.target.value)} disabled={isReadOnly} rows={4} className="w-full h-full bg-transparent outline-none resize-none focus:bg-primary/5 p-3 text-sm font-medium transition-all duration-300" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 수지표 요약 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            [ 수지표 요약 ]
            <span className="text-sm text-red-500 font-medium ml-1">* 자동 작성됨</span>
          </h3>
        </div>
        <div className="border border-gray-300 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="bg-gray-50 border-b border-gray-300 h-9">
                <th rowSpan={4} className="border-r border-gray-300 bg-gray-50 text-center font-bold px-3 w-24">용역</th>
                <th className="border-r border-gray-300 font-bold px-1 w-[84px]">구분</th>
                <th className="border-r border-gray-300 font-bold px-1">M/M</th>
                <th className="border-r border-gray-300 font-bold px-1">기준가</th>
                <th className="border-r border-gray-300 font-bold px-1">제안가</th>
                <th className="border-r border-gray-300 font-bold px-1">내부원가</th>
                <th className="border-r border-gray-300 font-bold px-1">지연비용</th>
                <th className="border-r border-gray-300 font-bold px-1">특별경비</th>
                <th className="border-r border-gray-300 font-bold px-1">일반경비</th>
                <th className="border-r border-gray-300 font-bold px-1">경상비용</th>
                <th className="border-r border-gray-300 font-bold px-1">수익률</th>
                <th className="font-bold px-1 text-center">손익</th>
              </tr>

              {/* 용역 */}
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 px-2 text-center bg-gray-50">위엠비</td>
                <td className="border-r border-gray-300 text-right px-2">{srvSum.internal.mm.toFixed(2)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-medium"></td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.internal.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.internal.cost)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.internal.delay)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.internal.special)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.internal.general)}</td>
                <td className="border-r border-gray-300 text-right px-2">0</td>
                <td className="border-r border-gray-300 text-right px-2">{calcRate(srvSum.internal.proposal - (srvSum.internal.cost + srvSum.internal.delay + srvSum.internal.special + srvSum.internal.general), srvSum.internal.proposal)}</td>
                <td className={`text-right px-2 font-medium ${getClr(srvSum.internal.proposal - (srvSum.internal.cost + srvSum.internal.delay + srvSum.internal.special + srvSum.internal.general))}`}>
                  {fmt(srvSum.internal.proposal - (srvSum.internal.cost + srvSum.internal.delay + srvSum.internal.special + srvSum.internal.general))}
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 px-2 text-center bg-gray-50">외주</td>
                <td className="border-r border-gray-300 text-right px-2">{srvSum.external.mm.toFixed(2)}</td>
                <td className="border-r border-gray-300 text-right px-2"></td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.external.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(srvSum.external.cost)}</td>
                <td className="border-r border-gray-300 text-right px-2">0</td>
                <td className="border-r border-gray-300 text-right px-2">0</td>
                <td className="border-r border-gray-300 text-right px-2">0</td>
                <td className="border-r border-gray-300 text-right px-2">0</td>
                <td className="border-r border-gray-300 text-right px-2">{calcRate(srvSum.external.proposal - srvSum.external.cost, srvSum.external.proposal)}</td>
                <td className={`text-right px-2 font-medium ${getClr(srvSum.external.proposal - srvSum.external.cost)}`}>
                  {fmt(srvSum.external.proposal - srvSum.external.cost)}
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300 bg-gray-50/30">
                <td className="border-r border-gray-300 px-2 font-bold text-center bg-gray-50">소계</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{(srvSum.internal.mm + srvSum.external.mm).toFixed(2)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold"></td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.proposal + srvSum.external.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.cost + srvSum.external.cost)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.delay + srvSum.external.delay)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.special)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.general)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">0</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{calcRate(srvSum.total.profit, srvSum.total.proposal)}</td>
                <td className={`text-right px-2 font-bold ${getClr(srvSum.total.profit) || "text-blue-700"}`} data-srv-profit={srvSum.total.profit}>
                  {fmt(srvSum.total.profit)}
                </td>
              </tr>
              {/* 제품 */}
              <tr className="h-9 border-b border-gray-300 bg-gray-50">
                <td rowSpan={4} className="border-r border-gray-300 bg-gray-50 text-center font-bold px-3 w-24">제품/상품</td>
                <td className="border-r border-gray-300 px-2 font-bold text-center w-[84px]">구분</td>
                <td className="border-r border-gray-300 text-center font-bold"></td>
                <td className="border-r border-gray-300 text-center font-bold">기준가</td>
                <td className="border-r border-gray-300 text-center font-bold">제안가</td>
                <td className="border-r border-gray-300 text-center font-bold">원가</td>
                <td colSpan={4} className="border-r border-gray-300 bg-gray-50/20 text-center font-bold"></td>
                <td className="border-r border-gray-300 text-center font-bold">수익률</td>
                <td className="text-center px-2 font-bold">손익</td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 px-2 text-center bg-gray-50">위엠비</td>
                <td className="border-r border-gray-300 text-right px-2"></td>
                <td className="border-r border-gray-300 text-right px-2"></td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(prdSum.internal.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(prdSum.internal.cost)}</td>
                <td colSpan={4} className="border-r border-gray-300 bg-gray-50/20"></td>
                <td className="border-r border-gray-300 text-right px-2">{calcRate(prdSum.internal.proposal - prdSum.internal.cost, prdSum.internal.proposal)}</td>
                <td className={`text-right px-2 font-medium ${getClr(prdSum.internal.proposal - prdSum.internal.cost)}`}>
                  {fmt(prdSum.internal.proposal - prdSum.internal.cost)}
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 px-2 text-center bg-gray-50">외주</td>
                <td className="border-r border-gray-300 text-right px-2"></td>
                <td className="border-r border-gray-300 text-right px-2"></td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(prdSum.external.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2">{fmt(prdSum.external.cost)}</td>
                <td colSpan={4} className="border-r border-gray-300 bg-gray-50/20"></td>
                <td className="border-r border-gray-300 text-right px-2">{calcRate(prdSum.external.proposal - prdSum.external.cost, prdSum.external.proposal)}</td>
                <td className={`text-right px-2 font-medium ${getClr(prdSum.external.proposal - prdSum.external.cost)}`}>
                  {fmt(prdSum.external.proposal - prdSum.external.cost)}
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300 bg-gray-50/30">
                <td className="border-r border-gray-300 px-2 font-bold text-center bg-gray-50">소계</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold"></td>
                <td className="border-r border-gray-300 text-right px-2 font-bold"></td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(prdSum.internal.proposal + prdSum.external.proposal)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(prdSum.internal.cost + prdSum.external.cost)}</td>
                <td colSpan={4} className="border-r border-gray-300 bg-gray-50/20"></td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{calcRate(prdSum.total.profit, prdSum.total.proposal)}</td>
                <td className={`text-right px-2 font-bold ${getClr(prdSum.total.profit) || "text-blue-700"}`} data-prd-profit={prdSum.total.profit}>
                  {fmt(prdSum.total.profit)}
                </td>
              </tr>
              {/* 합계 */}
              <tr className="h-10 bg-gray-100 font-bold text-center">
                <td colSpan={2} className="border-r border-gray-300 uppercase tracking-wider">합계</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{(summary.srv.internal.mm + summary.srv.external.mm).toFixed(2)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold"></td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(summary.totalRevenue)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(
                  (srvSum.internal.cost + srvSum.external.cost) +
                  (prdSum.internal.cost + prdSum.external.cost)
                )}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.delay + srvSum.external.delay)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.special)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">{fmt(srvSum.internal.general)}</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold">0</td>
                <td className="border-r border-gray-300 text-right px-2 font-bold text-blue-800">{calcRate(summary.netProfit, summary.totalRevenue)}</td>
                <td className={`text-right px-2 font-bold text-sm ${getClr(summary.netProfit) || "text-blue-800"}`}>
                  {fmt(summary.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 대금 조건 */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 italic flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          Payment Terms
        </h3>
        <div className="border border-gray-300">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 h-9">
                <th className="border-r border-gray-300 font-bold px-3 text-center" colSpan={2}>구분</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center">선급금</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center">1차 중도금</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center">2차 중도금</th>
                <th className="font-bold px-3 text-center">잔금</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-10 border-b border-gray-300">
                <th rowSpan={2} className="bg-gray-50 border-r border-gray-300 px-3 text-center font-bold text-gray-700 w-24">용역</th>
                <td className="border-r border-gray-300 bg-gray-50 text-center font-medium w-[84px]">비율(%)</td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <div className="flex items-center gap-1 justify-center">
                    <input type="text" value={paymentTerms.labor?.[0]?.rate || ""} onChange={e => {
                      const newTerms = { ...paymentTerms };
                      if (!newTerms.labor[0]) newTerms.labor[0] = { rate: "", timing: "" };
                      newTerms.labor[0].rate = e.target.value;
                      setPaymentTerms(newTerms);
                    }} disabled={isReadOnly} placeholder="" className="w-full h-11 text-center bg-transparent outline-none focus:bg-primary/5 transition-all duration-300 font-bold" />
                  </div>
                </td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <input type="text" value={paymentTerms.labor?.[1]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[1]) newTerms.labor[1] = { rate: "", timing: "" };
                    newTerms.labor[1].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <input type="text" value={paymentTerms.labor?.[2]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[2]) newTerms.labor[2] = { rate: "", timing: "" };
                    newTerms.labor[2].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="px-2 align-middle">
                  <input type="text" value={paymentTerms.labor?.[3]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[3]) newTerms.labor[3] = { rate: "", timing: "" };
                    newTerms.labor[3].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 bg-gray-50 text-center font-medium w-[84px]">시기</td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.labor?.[0]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[0]) newTerms.labor[0] = { rate: "", timing: "" };
                    newTerms.labor[0].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.labor?.[1]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[1]) newTerms.labor[1] = { rate: "", timing: "" };
                    newTerms.labor[1].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.labor?.[2]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[2]) newTerms.labor[2] = { rate: "", timing: "" };
                    newTerms.labor[2].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.labor?.[3]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.labor[3]) newTerms.labor[3] = { rate: "", timing: "" };
                    newTerms.labor[3].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <th rowSpan={2} className="bg-gray-50 border-r border-gray-300 px-3 text-center font-bold text-gray-700">제품/상품</th>
                <td className="border-r border-gray-300 bg-gray-50 text-center font-medium w-[84px]">비율(%)</td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <input type="text" value={paymentTerms.product?.[0]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[0]) newTerms.product[0] = { rate: "", timing: "" };
                    newTerms.product[0].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <input type="text" value={paymentTerms.product?.[1]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[1]) newTerms.product[1] = { rate: "", timing: "" };
                    newTerms.product[1].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle">
                  <input type="text" value={paymentTerms.product?.[2]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[2]) newTerms.product[2] = { rate: "", timing: "" };
                    newTerms.product[2].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="px-2 align-middle">
                  <input type="text" value={paymentTerms.product?.[3]?.rate || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[3]) newTerms.product[3] = { rate: "", timing: "" };
                    newTerms.product[3].rate = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
              </tr>
              <tr className="h-10 border-b border-gray-300">
                <td className="border-r border-gray-300 bg-gray-50 text-center font-medium w-20">시기</td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.product?.[0]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[0]) newTerms.product[0] = { rate: "", timing: "" };
                    newTerms.product[0].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.product?.[1]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[1]) newTerms.product[1] = { rate: "", timing: "" };
                    newTerms.product[1].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="border-r border-gray-300 px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.product?.[2]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[2]) newTerms.product[2] = { rate: "", timing: "" };
                    newTerms.product[2].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
                <td className="px-2 align-middle bg-gray-50/10">
                  <input type="text" value={paymentTerms.product?.[3]?.timing || ""} onChange={e => {
                    const newTerms = { ...paymentTerms };
                    if (!newTerms.product[3]) newTerms.product[3] = { rate: "", timing: "" };
                    newTerms.product[3].timing = e.target.value;
                    setPaymentTerms(newTerms);
                  }} disabled={isReadOnly} placeholder="" className="w-full text-center text-sm text-gray-600 bg-transparent outline-none focus:bg-blue-50/50" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 협력 업체 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            [ 협력 업체 ]
          </h3>
          {!isReadOnly && (
            <button
              onClick={() => setPartners([...partners, { name: "", role: "", manager: "", contact: "", remarks: "" }])}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              + 업체 추가
            </button>
          )}
        </div>
        <div className="border border-gray-300 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 h-9">
                <th className="border-r border-gray-300 font-bold px-3 text-center w-[180px]">업체명</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center w-60">역할</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center w-32">담당자</th>
                <th className="border-r border-gray-300 font-bold px-3 text-center w-40">연락처</th>
                <th className="font-bold px-3 text-center">비고</th>
                {!isReadOnly && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {partners.map((partner, idx) => (
                <tr key={idx} className="h-10 border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 align-middle">
                    <input type="text" value={partner.name} onChange={e => {
                      const newPartners = [...partners];
                      newPartners[idx].name = e.target.value;
                      setPartners(newPartners);
                    }} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 px-1" />
                  </td>
                  <td className="border-r border-gray-300 px-2 align-middle">
                    <input type="text" value={partner.role} onChange={e => {
                      const newPartners = [...partners];
                      newPartners[idx].role = e.target.value;
                      setPartners(newPartners);
                    }} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 px-1" />
                  </td>
                  <td className="border-r border-gray-300 px-2 align-middle">
                    <input type="text" value={partner.manager} onChange={e => {
                      const newPartners = [...partners];
                      newPartners[idx].manager = e.target.value;
                      setPartners(newPartners);
                    }} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 px-1 text-center" />
                  </td>
                  <td className="border-r border-gray-300 px-2 align-middle">
                    <input type="text" value={partner.contact} onChange={e => {
                      const newPartners = [...partners];
                      newPartners[idx].contact = e.target.value;
                      setPartners(newPartners);
                    }} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 px-1 text-center" />
                  </td>
                  <td className="px-2 align-middle">
                    <input type="text" value={partner.remarks} onChange={e => {
                      const newPartners = [...partners];
                      newPartners[idx].remarks = e.target.value;
                      setPartners(newPartners);
                    }} disabled={isReadOnly} className="w-full bg-transparent outline-none focus:bg-blue-50/50 px-1" />
                  </td>
                  {!isReadOnly && (
                    <td className="text-center">
                      <button onClick={() => setPartners(partners.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">×</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
