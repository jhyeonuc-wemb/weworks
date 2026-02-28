"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity, GitCommit } from "lucide-react";

// 인라인 포맷 함수
const fmtMoney = (v: number) => Math.round(v * 1000).toLocaleString();
const fmtRate = (v: number) => `${Number(v).toFixed(2)}%`;
const fmtMm = (v: number) => Number(v).toFixed(2);

interface VersionData {
    id: number;
    version: number;
    status: string;
    version_comment?: string;
    total_revenue?: number;
    operating_profit?: number;
    operating_profit_rate?: number;
    our_mm?: number;
    others_mm?: number;
}

interface VersionCompareTabProps {
    versions: VersionData[];
    currentVersionId?: number | null;
}

function DiffBadge({ value, isRate = false, formatVal }: { value: number; isRate?: boolean; formatVal: (v: number) => string }) {
    if (Math.abs(value) < 0.001) {
        return (
            <span className="inline-flex items-center justify-end text-sm font-medium text-gray-400">
                <span>{isRate ? "0.00%" : "0"}</span>
            </span>
        );
    }
    const isPositive = value > 0;
    return (
        <span className={cn(
            "inline-flex items-center justify-end gap-1 text-sm font-bold",
            isPositive ? "text-emerald-600" : "text-rose-600"
        )}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{formatVal(Math.abs(value))}</span>
        </span>
    );
}

const METRICS = [
    { key: "total_revenue" as keyof VersionData, label: "수주 합계", unit: "(원)", format: fmtMoney, isRate: false },
    { key: "operating_profit" as keyof VersionData, label: "예상 손익", unit: "(원)", format: fmtMoney, isRate: false },
    { key: "operating_profit_rate" as keyof VersionData, label: "손익률", unit: "(%)", format: fmtRate, isRate: true },
    { key: "our_mm" as keyof VersionData, label: "당사 M/M 투입", unit: "(M/M)", format: fmtMm, isRate: false },
    { key: "others_mm" as keyof VersionData, label: "타사 M/M 투입", unit: "(M/M)", format: fmtMm, isRate: false },
];

export default function VersionCompareTab({ versions, currentVersionId }: VersionCompareTabProps) {
    const sorted = useMemo(
        () => [...versions].sort((a, b) => a.version - b.version),
        [versions]
    );

    const prevVer = sorted.length >= 2 ? sorted[0] : null;
    const lastVer = sorted.length >= 1 ? sorted[sorted.length - 1] : null;

    if (versions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                <p>비교할 버전 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 타이틀 변경 (다른 탭들과 통일) */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900">버전별 수지분석 비교</h2>
                <p className="mt-1 text-sm text-gray-500">
                    각 버전의 핵심 지표 변화와 히스토리를 확인합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 좌측: 버전 히스토리 (타임라인 스타일) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex justify-between items-center min-h-[32px]">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <GitCommit className="h-5 w-5" />
                            버전 히스토리
                        </h3>
                    </div>
                    <div className="neo-light-card border border-gray-200/60 p-5 bg-white/50 space-y-4 rounded-2xl relative">
                        {/* 타임라인 연결선 */}
                        <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-gray-100"></div>

                        {sorted.map((v, idx) => {
                            const isCurrent = String(v.id) === String(currentVersionId);

                            return (
                                <div key={v.id} className="relative flex items-start gap-4">
                                    {/* 타임라인 노드 */}
                                    <div className={cn(
                                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                                        isCurrent ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-400"
                                    )}>
                                        <span className="text-sm font-bold">V{v.version}</span>
                                    </div>

                                    {/* 콘텐츠 카드 */}
                                    <div className={cn(
                                        "flex-1 rounded-xl border p-3 transition-colors",
                                        isCurrent ? "border-blue-200 bg-blue-50/80 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
                                    )}>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                            {v.version === 1
                                                ? "기준 계획"
                                                : (v.version_comment || <span className="text-gray-400 italic font-medium text-sm">작성된 코멘트가 없습니다.</span>)
                                            }
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 우측: 핵심 지표 비교 테이블 */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center min-h-[32px]">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <TrendingUp className="h-5 w-5" />
                            핵심 지표 변화
                        </h3>
                        {sorted.length >= 2 && prevVer && lastVer && (
                            <div className="flex items-center h-8 gap-2 bg-white px-3.5 rounded-full border border-gray-200 shadow-sm -my-2 relative z-20">
                                <span className="text-xs font-bold text-gray-400">비교</span>
                                <div className="w-[1px] h-3 bg-gray-200 mx-0.5"></div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-500">V{prevVer.version}</span>
                                    <ArrowRight className="h-4 w-4 text-gray-300" />
                                    <span className="text-sm font-bold text-blue-600">V{lastVer.version}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="neo-light-card border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200/80 bg-gray-50/50">
                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-500 min-w-[140px]">비교 항목</th>
                                        {sorted.map((v) => {
                                            const isCurrent = String(v.id) === String(currentVersionId);
                                            return (
                                                <th
                                                    key={v.id}
                                                    className={cn(
                                                        "px-4 py-4 text-right text-sm font-semibold border-l border-gray-100/50 relative min-w-[100px]",
                                                        isCurrent ? "text-blue-700 bg-blue-50/50" : "text-gray-600"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span>VERSION {v.version}</span>
                                                    </div>
                                                    {isCurrent && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"></div>}
                                                </th>
                                            );
                                        })}
                                        {sorted.length >= 2 && (
                                            <th className="px-5 py-4 text-right text-sm font-semibold text-gray-700 border-l border-gray-200 bg-orange-50/40 min-w-[120px]">
                                                <div className="flex items-center justify-end gap-1.5 font-bold">
                                                    최종 증감
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {METRICS.map((metric, idx) => {
                                        const prevVal = prevVer ? Number(prevVer[metric.key] ?? 0) : 0;
                                        const lastVal = lastVer ? Number(lastVer[metric.key] ?? 0) : 0;
                                        const diff = prevVer ? lastVal - prevVal : 0;

                                        return (
                                            <tr
                                                key={metric.key}
                                                className={cn(
                                                    "transition-colors hover:bg-gray-50/80",
                                                    idx !== METRICS.length - 1 && "border-b border-gray-100"
                                                )}
                                            >
                                                <td className="px-5 py-4 bg-white/50">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-800 text-sm">{metric.label}</span>
                                                        <span className="text-sm text-gray-400 font-medium">{metric.unit}</span>
                                                    </div>
                                                </td>
                                                {sorted.map((v) => {
                                                    const val = Number(v[metric.key] ?? 0);
                                                    const isCurrent = String(v.id) === String(currentVersionId);

                                                    let valColorClass = "text-gray-700";
                                                    if (metric.key === "operating_profit" || metric.key === "operating_profit_rate") {
                                                        if (val > 0) valColorClass = "text-emerald-600 font-bold";
                                                        else if (val < 0) valColorClass = "text-rose-600 font-bold";
                                                    }

                                                    return (
                                                        <td
                                                            key={v.id}
                                                            className={cn(
                                                                "px-4 py-4 text-right font-mono text-sm border-l border-gray-100/50",
                                                                valColorClass,
                                                                isCurrent && "bg-blue-50/20 font-bold"
                                                            )}
                                                        >
                                                            {metric.format(val)}
                                                        </td>
                                                    );
                                                })}
                                                {sorted.length >= 2 && (
                                                    <td className="px-5 py-4 text-right border-l border-gray-200 bg-orange-50/20">
                                                        <DiffBadge value={diff} isRate={metric.isRate} formatVal={metric.format} />
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
