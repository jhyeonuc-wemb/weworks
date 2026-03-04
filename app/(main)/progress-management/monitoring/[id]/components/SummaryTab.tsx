"use client";

import { BarChart3, FileSpreadsheet, Users } from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface SummaryTabProps {
    project: {
        id: string | number;
        name: string;
        customerName: string;
        projectCode: string;
    };
    currency: Currency;
    totalRevenue: number;
    serviceProfit: number;
    productProfit: number;
    businessProfit: number;
    extraRevenue: number;
    operatingProfit: number;
    profitRate: number;
    ourMm: number | string;
    othersMm: number | string;
    profitabilityId?: number;
}

export function SummaryTab({
    project,
    currency,
    totalRevenue,
    serviceProfit,
    productProfit,
    businessProfit,
    extraRevenue,
    operatingProfit,
    profitRate,
    ourMm,
    othersMm,
    profitabilityId,
}: SummaryTabProps) {
    const safeOurMm = parseFloat(String(ourMm || 0));
    const safeOthersMm = parseFloat(String(othersMm || 0));
    const totalMm = safeOurMm + safeOthersMm;

    const openProfitabilityPopup = () => {
        if (!profitabilityId) return;
        const url = `/projects/${project.id}/profitability?versionId=${profitabilityId}&isPopup=true`;
        window.open(url, 'profitability_popup', 'width=1400,height=900,scrollbars=yes');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 프로젝트 컨텍스트 (상단) */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                        <BarChart3 className="h-5 w-5" />
                        프로젝트 컨텍스트
                    </h3>
                    {profitabilityId && (
                        <button
                            onClick={openProfitabilityPopup}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            수지분석서 상세보기
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Project Name</p>
                        <p className="text-sm font-bold truncate">{project.name}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Client</p>
                        <p className="text-sm font-bold truncate">{project.customerName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Project Code</p>
                        <p className="text-sm font-bold font-mono">{project.projectCode}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Currency</p>
                        <p className="text-sm font-bold uppercase">{currency}</p>
                    </div>
                </div>
            </div>

            {/* 주요 지표 8종 (2행 4열 그리드) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. 수주 합계 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">수주 합계</p>
                    <p className="text-2xl font-black text-gray-900">{formatCurrency(totalRevenue * 1000, currency)}</p>
                </div>

                {/* 2. 용역 손익 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">용역 손익</p>
                    <p className={cn("text-2xl font-black", serviceProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {formatCurrency(serviceProfit * 1000, currency)}
                    </p>
                </div>

                {/* 3. 제품 손익 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">제품 손익</p>
                    <p className={cn("text-2xl font-black", productProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {formatCurrency(productProfit * 1000, currency)}
                    </p>
                </div>

                {/* 4. 사업 손익 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">사업 손익</p>
                    <p className={cn("text-2xl font-black", businessProfit >= 0 ? "text-blue-600" : "text-rose-600")}>
                        {formatCurrency(businessProfit * 1000, currency)}
                    </p>
                </div>

                {/* 5. 부가 수익 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">부가 수익</p>
                    <p className={cn("text-2xl font-black", extraRevenue >= 0 ? "text-amber-600" : "text-rose-600")}>
                        {formatCurrency(extraRevenue * 1000, currency)}
                    </p>
                </div>

                {/* 6. 영업 손익 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">영업 손익</p>
                    <p className={cn("text-2xl font-black", operatingProfit >= 0 ? "text-emerald-700 font-black" : "text-rose-700")}>
                        {formatCurrency(operatingProfit * 1000, currency)}
                    </p>
                </div>

                {/* 7. 이익률 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">이익률</p>
                    <p className={cn("text-2xl font-black", profitRate >= 0 ? "text-indigo-600" : "text-rose-600")}>
                        {formatPercent(profitRate)}
                    </p>
                </div>

                {/* 8. 총 투입 공수 */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">총 투입 공수</p>
                    <p className="text-2xl font-black text-gray-900">{totalMm.toFixed(2)} <span className="text-sm">M/M</span></p>
                </div>
            </div>

            {/* 인력 투입 비중 (M/M) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-purple-500 rounded-full" />
                    인력 투입 비중 (M/M)
                </h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-bold text-gray-600">당사 인력</span>
                            <span className="font-mono font-bold text-gray-900">{safeOurMm.toFixed(2)} M/M</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500/80" style={{ width: `${(safeOurMm / (totalMm || 1)) * 100}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-bold text-gray-600">외주 인력</span>
                            <span className="font-mono font-bold text-gray-900">{safeOthersMm.toFixed(2)} M/M</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400/80" style={{ width: `${(safeOthersMm / (totalMm || 1)) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
