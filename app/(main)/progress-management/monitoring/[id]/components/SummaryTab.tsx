"use client";

import { BarChart3, DollarSign, TrendingUp, Users } from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface SummaryTabProps {
    projectName: string;
    customerName: string;
    projectCode: string;
    currency: Currency;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitRate: number;
    ourMm: number | string;
    othersMm: number | string;
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
    const safeOurMm = parseFloat(String(ourMm || 0));
    const safeOthersMm = parseFloat(String(othersMm || 0));
    const totalMm = safeOurMm + safeOthersMm;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h2 className="text-xl font-bold text-gray-900">수지분석서 지표 요약</h2>
                <p className="mt-1 text-sm text-gray-500">
                    선택된 버전의 수지분석서 주요 재무 및 인력 지표를 실시간으로 요약하여 표시합니다.
                </p>
            </div>

            {/* 핵심 지표 그리드 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* 수주 금액 */}
                <div className="relative group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-xl bg-blue-100/50 text-blue-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-blue-600/70 uppercase tracking-wider">수주 합계</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">
                        {formatCurrency(totalRevenue * 1000, currency)}
                    </p>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <DollarSign size={100} />
                    </div>
                </div>

                {/* 손익 */}
                <div className={cn(
                    "relative group overflow-hidden rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300",
                    netProfit >= 0 ? "border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white" : "border-rose-100 bg-gradient-to-br from-rose-50/50 to-white"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                            "p-2 rounded-xl",
                            netProfit >= 0 ? "bg-emerald-100/50 text-emerald-600" : "bg-rose-100/50 text-rose-600"
                        )}>
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <p className={cn(
                        "text-sm font-bold uppercase tracking-wider",
                        netProfit >= 0 ? "text-emerald-600/70" : "text-rose-600/70"
                    )}>영업 손익</p>
                    <p className={cn(
                        "mt-2 text-3xl font-black",
                        netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}>
                        {formatCurrency(netProfit * 1000, currency)}
                    </p>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <TrendingUp size={100} />
                    </div>
                </div>

                {/* 손익률 */}
                <div className={cn(
                    "relative group overflow-hidden rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300",
                    profitRate >= 0 ? "border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white" : "border-rose-100 bg-gradient-to-br from-rose-50/50 to-white"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                            "p-2 rounded-xl",
                            profitRate >= 0 ? "bg-indigo-100/50 text-indigo-600" : "bg-rose-100/50 text-rose-600"
                        )}>
                            <BarChart3 className="h-5 w-5" />
                        </div>
                    </div>
                    <p className={cn(
                        "text-sm font-bold uppercase tracking-wider",
                        profitRate >= 0 ? "text-indigo-600/70" : "text-rose-600/70"
                    )}>이익률</p>
                    <p className={cn(
                        "mt-2 text-3xl font-black",
                        profitRate >= 0 ? "text-indigo-700" : "text-rose-700"
                    )}>
                        {formatPercent(profitRate)}
                    </p>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <BarChart3 size={100} />
                    </div>
                </div>

                {/* 총 투입 M/M */}
                <div className="relative group overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-xl bg-slate-100/50 text-slate-600">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-slate-600/70 uppercase tracking-wider">총 투입 공수</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">
                        {totalMm.toFixed(2)} <span className="text-sm">M/M</span>
                    </p>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Users size={100} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* 인력 구성 분석 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                        인력 투입 비중 (M/M)
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-gray-600">당사 인력</span>
                                <span className="font-mono font-black text-gray-900">{safeOurMm.toFixed(2)} M/M</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${(safeOurMm / (totalMm || 1)) * 100}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-gray-600">외주 인력</span>
                                <span className="font-mono font-black text-gray-900">{safeOthersMm.toFixed(2)} M/M</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400" style={{ width: `${(safeOthersMm / (totalMm || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 기본 정보 요약 */}
                <div className="bg-slate-900 rounded-2xl p-8 shadow-lg text-white">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
                        <BarChart3 className="h-5 w-5" />
                        프로젝트 컨텍스트
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Project Name</p>
                            <p className="text-sm font-bold truncate">{projectName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Client</p>
                            <p className="text-sm font-bold truncate">{customerName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm font-bold uppercase">{currency}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Code</p>
                            <p className="text-sm font-bold font-mono">{projectCode}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
