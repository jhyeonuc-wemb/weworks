"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// 인라인 포맷 함수
const fmtMoney = (v: number) => Math.round(v).toLocaleString();
const fmtRate = (v: number) => `${Number(v).toFixed(1)}%`;
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

function DiffBadge({ value, isRate = false }: { value: number; isRate?: boolean }) {
    if (Math.abs(value) < 0.001) {
        return (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                <Minus className="h-3 w-3" />
                {isRate ? "0.0%" : "0"}
            </span>
        );
    }
    const isPositive = value > 0;
    return (
        <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            isPositive ? "text-emerald-600" : "text-rose-600"
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {value > 0 ? "+" : ""}
            {isRate ? fmtRate(value) : value.toLocaleString()}
        </span>
    );
}

const METRICS = [
    { key: "total_revenue" as keyof VersionData, label: "수주합계", unit: "(천원)", format: fmtMoney, isRate: false },
    { key: "operating_profit" as keyof VersionData, label: "손익", unit: "(천원)", format: fmtMoney, isRate: false },
    { key: "operating_profit_rate" as keyof VersionData, label: "손익률", unit: "(%)", format: fmtRate, isRate: true },
    { key: "our_mm" as keyof VersionData, label: "당사 M/M", unit: "(M/M)", format: fmtMm, isRate: false },
    { key: "others_mm" as keyof VersionData, label: "타사 M/M", unit: "(M/M)", format: fmtMm, isRate: false },
];

export default function VersionCompareTab({ versions, currentVersionId }: VersionCompareTabProps) {
    const sorted = useMemo(
        () => [...versions].sort((a, b) => a.version - b.version),
        [versions]
    );

    const prevVer = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    const lastVer = sorted.length >= 1 ? sorted[sorted.length - 1] : null;

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-700">버전별 수지 비교</h3>

            {/* 버전 코멘트 영역 */}
            <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-blue-50/50">
                            <th className="px-[10px] h-[35px] text-left text-xs font-bold text-gray-600 border-b border-gray-300 w-36">
                                버전
                            </th>
                            <th className="px-[10px] h-[35px] text-left text-xs font-bold text-gray-600 border-b border-gray-300 border-l">
                                작성 코멘트
                            </th>
                            <th className="px-[10px] h-[35px] text-center text-xs font-bold text-gray-600 border-b border-gray-300 border-l w-24">
                                상태
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((v, idx) => (
                            <tr key={v.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                                <td className={cn(
                                    "px-[10px] h-[35px] text-xs font-bold border-b border-gray-300",
                                    String(v.id) === String(currentVersionId) ? "text-blue-600" : "text-gray-700"
                                )}>
                                    VERSION {v.version}
                                    {String(v.id) === String(currentVersionId) && (
                                        <span className="ml-1 text-[10px] text-blue-400">● 현재</span>
                                    )}
                                </td>
                                <td className="px-[10px] h-[35px] text-xs text-gray-700 border-b border-gray-300 border-l">
                                    {v.version_comment || <span className="text-gray-300 italic">-</span>}
                                </td>
                                <td className="px-[10px] h-[35px] text-center text-xs border-b border-gray-300 border-l">
                                    {v.status === "COMPLETED" ? (
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">완료</span>
                                    ) : v.status === "IN_PROGRESS" ? (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">작성중</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">대기</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 지표 비교 테이블 */}
            <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-blue-50/50">
                            <th className="px-[10px] h-[35px] text-left text-xs font-bold text-gray-600 border-b border-gray-300 w-36">
                                항목
                            </th>
                            {sorted.map((v) => (
                                <th
                                    key={v.id}
                                    className={cn(
                                        "px-[10px] h-[35px] text-right text-xs font-bold border-b border-gray-300 border-l",
                                        String(v.id) === String(currentVersionId) ? "bg-blue-600 text-white" : "text-gray-600"
                                    )}
                                >
                                    V{v.version}
                                    {String(v.id) === String(currentVersionId) && <span className="ml-1 opacity-60">●</span>}
                                </th>
                            ))}
                            {sorted.length >= 2 && (
                                <th className="px-[10px] h-[35px] text-center text-xs font-bold text-gray-600 border-b border-gray-300 border-l bg-orange-50/60 w-32">
                                    V{prevVer!.version} → V{lastVer!.version}
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
                                <tr key={metric.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                                    <td className="px-[10px] h-[35px] text-xs font-bold text-gray-600 border-b border-gray-300">
                                        {metric.label}
                                        <span className="ml-1 font-normal text-gray-400">{metric.unit}</span>
                                    </td>
                                    {sorted.map((v) => {
                                        const val = Number(v[metric.key] ?? 0);
                                        return (
                                            <td
                                                key={v.id}
                                                className={cn(
                                                    "px-[10px] h-[35px] text-right text-xs font-mono border-b border-gray-300 border-l",
                                                    (metric.key === "operating_profit" || metric.key === "operating_profit_rate")
                                                        ? val >= 0 ? "text-emerald-700" : "text-rose-600"
                                                        : "text-gray-800"
                                                )}
                                            >
                                                {metric.format(val)}
                                            </td>
                                        );
                                    })}
                                    {sorted.length >= 2 && (
                                        <td className="px-[10px] h-[35px] text-center border-b border-gray-300 border-l bg-orange-50/30">
                                            <DiffBadge value={diff} isRate={metric.isRate} />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
