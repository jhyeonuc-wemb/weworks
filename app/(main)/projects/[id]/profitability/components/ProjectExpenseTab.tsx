"use client";

import React, { useMemo } from "react";
import { Save, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useProjectExpense } from "@/hooks/useProjectExpense";
import type { Project, StandardExpense, ManpowerPlanItem } from "@/types/profitability";
import { Currency } from "@/lib/utils/currency";
import { DatePicker, MonthPicker, useToast } from "@/components/ui";

interface ProjectExpenseTabProps {
    projectId: number;
    project: Project | null;
    manpowerPlanItems: ManpowerPlanItem[];
    standardExpenses: StandardExpense[];
    currency: Currency;
    status: string;
    onSave?: () => void;
    profitabilityId?: number;
}

export function ProjectExpenseTab({
    projectId,
    project,
    manpowerPlanItems,
    standardExpenses,
    currency,
    status,
    onSave,
    profitabilityId,
}: ProjectExpenseTabProps) {
    const isReadOnly = status === "completed" || status === "COMPLETED" || status === "approved" || status === "APPROVED" || status === "review";
    const {
        items,
        loading,
        saving,
        startMonth,
        setStartMonth,
        endMonth,
        setEndMonth,
        updateItemValue,
        updateItemName,
        toggleAutoCalculate,
        saveExpensePlan,
        recalculateData,
        mmSummary,
    } = useProjectExpense(projectId, project, manpowerPlanItems, standardExpenses, profitabilityId);

    const { showToast, confirm: showConfirm } = useToast();

    const handleSave = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            await saveExpensePlan();
            showToast("프로젝트 경비 계획이 저장되었습니다.", "success");
            if (onSave) onSave();
        } catch (error) {
            showToast("경비 계획 저장에 실패했습니다.", "error");
        }
    };

    const handleRecalculate = () => {
        showConfirm({
            title: "데이터 갱신",
            message: "인력 계획과 기준경비의 최신 데이터를 반영하여 재계산하시겠습니까?\n수동으로 입력한 값은 유지되지만, 자동 계산 항목은 업데이트됩니다.",
            onConfirm: () => {
                recalculateData();
            }
        });
    };

    // 렌더링을 위한 데이터 준비
    const { sortedYears, yearGroups, months } = useMemo(() => {
        if (!startMonth || !endMonth) {
            return { sortedYears: [], yearGroups: {}, months: [] };
        }

        const start = new Date(startMonth + '-01');
        const end = new Date(endMonth + '-01');
        const startY = start.getFullYear();

        const groups: { [year: number]: { label: string; count: number } } = {};
        const ms: { key: string; label: string }[] = [];

        const current = new Date(start);
        while (current <= end) {
            const year = current.getFullYear();
            if (!groups[year]) {
                const yearIndex = year - startY;
                const shortYear = String(year).slice(-2);
                let label = '';
                if (yearIndex === 0) label = `당년(${shortYear}년)`;
                else if (yearIndex === 1) label = `차년(${shortYear}년)`;
                else if (yearIndex === 2) label = `차차년(${shortYear}년)`;
                else label = `${shortYear}년`;
                groups[year] = { label, count: 0 };
            }
            groups[year].count++;

            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            ms.push({ key: monthKey, label: `${current.getMonth() + 1}월` });

            current.setMonth(current.getMonth() + 1);
        }

        const sYears = Object.keys(groups).map(Number).sort();
        return { sortedYears: sYears, yearGroups: groups, months: ms };
    }, [startMonth, endMonth]);

    if (loading) return <div className="flex items-center justify-center py-12 text-sm text-gray-500">로딩 중...</div>;

    const fmtNum = (n: number) => Math.round(n).toLocaleString();

    const renderMonthValue = (item: any, monthKey: string) => {
        const value = item.monthlyValues[monthKey] || 0;
        const isGeneralExpense = item.category === "일반경비";
        const isCalculatedItem = [1, 2, 3, 6, 7, 8].includes(item.id) && item.isAutoCalculated;

        // 일반경비 또는 읽기 전용 상태인 경우 텍스트로 표시
        if (isGeneralExpense || isReadOnly) {
            return (
                <div className="w-full h-full flex items-center justify-end px-[10px]">
                    <span className="text-sm text-gray-900">
                        {Math.round(value).toLocaleString()}
                    </span>
                </div>
            );
        }

        const displayValue = value === 0 ? "0" : Math.round(value).toLocaleString();

        return (
            <input
                type="text"
                value={displayValue}
                onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, "");
                    if (rawValue === "") {
                        updateItemValue(item.id, monthKey, 0);
                        return;
                    }
                    const val = parseInt(rawValue);
                    if (!isNaN(val)) {
                        updateItemValue(item.id, monthKey, val);
                    }
                }}
                className={`w-full h-full border-none rounded-none px-[10px] text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors placeholder:text-gray-400`}
            />
        );
    };

    const calculateRowTotal = (item: any) => {
        return Object.values(item.monthlyValues).reduce((sum: number, val: any) => sum + (val || 0), 0);
    };

    const calculateRowYearTotal = (item: any, year: number) => {
        return Object.entries(item.monthlyValues)
            .filter(([month]) => month.startsWith(`${year}-`))
            .reduce((sum: number, [, val]: [string, any]) => sum + (val || 0), 0);
    };

    const generalExpenses = items.filter(i => i.category === "일반경비");
    const specialExpenses = items.filter(i => i.category === "특별경비");

    const getSectionTotal = (sectionItems: any[], monthKey: string) => {
        return sectionItems.reduce((sum, item) => sum + (item.monthlyValues[monthKey] || 0), 0);
    };

    const getGrandTotal = (monthKey: string) => {
        return items.reduce((sum, item) => sum + (item.monthlyValues[monthKey] || 0), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">프로젝트 경비</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        프로젝트 기간 동안 발생하는 경비 계획을 월별로 관리합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 leading-normal whitespace-nowrap">시작월</span>
                        <MonthPicker
                            date={startMonth ? new Date(startMonth + "-01") : undefined}
                            setDate={(date) => setStartMonth(date ? format(date, "yyyy-MM") : "")}
                            disabled={isReadOnly}
                            className="w-28"
                            placeholder="시작월 선택"
                        />
                    </div>
                    <span className="text-gray-400 mx-1">~</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 leading-normal whitespace-nowrap">종료월</span>
                        <MonthPicker
                            date={endMonth ? new Date(endMonth + "-01") : undefined}
                            setDate={(date) => setEndMonth(date ? format(date, "yyyy-MM") : "")}
                            disabled={isReadOnly}
                            className="w-28"
                            placeholder="종료월 선택"
                        />
                    </div>
                    <div className="flex flex-col justify-end pb-1.5 h-full px-2">
                        <span className="text-sm text-gray-500">(단위:천원)</span>
                    </div>
                    {!isReadOnly && (
                        <>
                            <button
                                type="button"
                                onClick={handleRecalculate}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 h-10 text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                title="데이터 갱신"
                            >
                                <RefreshCw className="h-4 w-4" />
                                데이터 갱신
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSave(e)}
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
            <div className="overflow-x-auto bg-white">
                <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col className="w-[80px]" />
                        <col className="w-[180px]" />
                        {/* 합계(1) + 연도별 합계(sortedYears.length) + 월별(months.length) */}
                        {Array.from({ length: 1 + sortedYears.length + months.length }).map((_, i) => (
                            <col key={i} className="w-[90px]" />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                            <th rowSpan={2} colSpan={2} className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50 w-[260px]">구분</th>
                            <th colSpan={1 + sortedYears.length} className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50">총투입 M/M</th>
                            {sortedYears.map(year => (
                                <th key={`year-header-${year}`} colSpan={yearGroups[year].count} className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50 text-center">
                                    {yearGroups[year].label}
                                </th>
                            ))}
                        </tr>
                        <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                            <th className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50 w-[90px]">합계</th>
                            {sortedYears.map(year => (
                                <th key={`year-sum-header-${year}`} className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50 w-[90px]">{String(year).slice(-2)}년</th>
                            ))}
                            {months.map(m => (
                                <th key={m.key} className="border border-gray-300 px-[10px] text-sm font-bold bg-blue-50/50 w-[90px] text-center">{m.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {/* 투여공수 섹션 */}
                        <tr className="h-[35px]">
                            <td rowSpan={2} className="border border-gray-300 border-b-[3px] border-double px-[10px] text-sm text-gray-900 text-center w-[80px] whitespace-nowrap">투여공수</td>
                            <td className="border border-gray-300 px-[10px] text-sm text-gray-700 w-[180px] whitespace-nowrap">당사</td>
                            <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                {Math.round(Object.values(mmSummary).reduce((s, v) => s + v.wemb, 0))}
                            </td>
                            {sortedYears.map(year => (
                                <td key={`mm-wemb-year-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {Math.round(Object.entries(mmSummary)
                                        .filter(([m]) => m.startsWith(`${year}-`))
                                        .reduce((s, [, v]) => s + v.wemb, 0))}
                                </td>
                            ))}
                            {months.map(m => (
                                <td key={`mm-wemb-${m.key}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {Math.round(mmSummary[m.key]?.wemb || 0)}
                                </td>
                            ))}
                        </tr>
                        <tr className="h-[35px]">
                            <td className="border border-gray-300 border-b-[3px] border-double px-[10px] text-sm text-gray-700 whitespace-nowrap">외주</td>
                            <td className="border border-gray-300 border-b-[3px] border-double px-[10px] text-right text-sm text-gray-900">
                                {Math.round(Object.values(mmSummary).reduce((s, v) => s + v.external, 0))}
                            </td>
                            {sortedYears.map(year => (
                                <td key={`mm-ext-year-${year}`} className="border border-gray-300 border-b-[3px] border-double px-[10px] text-right text-sm text-gray-900">
                                    {Math.round(Object.entries(mmSummary)
                                        .filter(([m]) => m.startsWith(`${year}-`))
                                        .reduce((s, [, v]) => s + v.external, 0))}
                                </td>
                            ))}
                            {months.map(m => (
                                <td key={`mm-ext-${m.key}`} className="border border-gray-300 border-b-[3px] border-double px-[10px] text-right text-sm text-gray-900">
                                    {Math.round(mmSummary[m.key]?.external || 0)}
                                </td>
                            ))}
                        </tr>

                        {/* 일반경비 섹션 */}
                        {generalExpenses.map((item, idx) => (
                            <tr key={item.id} className="h-[35px]">
                                {idx === 0 && (
                                    <td rowSpan={generalExpenses.length + 1} className="border border-gray-300 px-[10px] py-4 text-sm text-gray-900 text-center whitespace-nowrap">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>일반경비</span>
                                        </div>
                                    </td>
                                )}
                                <td className="border border-gray-300 px-[10px] text-sm text-gray-700 whitespace-nowrap">
                                    {item.item}
                                </td>
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(calculateRowTotal(item))}
                                </td>
                                {sortedYears.map(year => (
                                    <td key={`gen-year-${item.id}-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-800">
                                        {fmtNum(calculateRowYearTotal(item, year))}
                                    </td>
                                ))}
                                {months.map(m => (
                                    <td key={`gen-${item.id}-${m.key}`} className="border border-gray-300 p-0 h-[35px]">
                                        {renderMonthValue(item, m.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="bg-gray-50 h-[35px]">
                            <td className="border border-gray-300 px-[10px] text-sm text-center">소계</td>
                            <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900 bg-gray-50">
                                {fmtNum(generalExpenses.reduce((sum, item) => sum + calculateRowTotal(item), 0))}
                            </td>
                            {sortedYears.map(year => (
                                <td key={`gen-sub-year-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(generalExpenses.reduce((sum, item) => sum + calculateRowYearTotal(item, year), 0))}
                                </td>
                            ))}
                            {months.map(m => (
                                <td key={`gen-sub-${m.key}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(getSectionTotal(generalExpenses, m.key))}
                                </td>
                            ))}
                        </tr>

                        {/* 특별경비 섹션 */}
                        {specialExpenses.map((item, idx) => (
                            <tr key={item.id} className="h-[35px]">
                                {idx === 0 && (
                                    <td rowSpan={specialExpenses.length + 1} className="border border-gray-300 px-[10px] py-4 text-sm text-gray-900 text-center whitespace-nowrap">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>특별경비</span>
                                        </div>
                                    </td>
                                )}
                                <td className={`border border-gray-300 text-sm text-gray-700 h-[35px] ${item.id === 9 ? 'p-0' : 'px-[10px]'}`}>
                                    {item.id === 9 ? (
                                        <input
                                            type="text"
                                            value={item.item}
                                            onChange={(e) => updateItemName(item.id, e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors px-[10px] py-0 text-sm text-gray-700 placeholder:text-gray-400"
                                        />
                                    ) : (
                                        item.item
                                    )}
                                </td>
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(calculateRowTotal(item))}
                                </td>
                                {sortedYears.map(year => (
                                    <td key={`spec-year-${item.id}-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-800">
                                        {fmtNum(calculateRowYearTotal(item, year))}
                                    </td>
                                ))}
                                {months.map(m => (
                                    <td key={`spec-${item.id}-${m.key}`} className="border border-gray-300 p-0 h-[35px]">
                                        {renderMonthValue(item, m.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="bg-gray-50 h-[35px]">
                            <td className="border border-gray-300 px-[10px] text-sm text-center">소계</td>
                            <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900 bg-gray-50">
                                {fmtNum(specialExpenses.reduce((sum, item) => sum + calculateRowTotal(item), 0))}
                            </td>
                            {sortedYears.map(year => (
                                <td key={`spec-sub-year-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(specialExpenses.reduce((sum, item) => sum + calculateRowYearTotal(item, year), 0))}
                                </td>
                            ))}
                            {months.map(m => (
                                <td key={`spec-sub-${m.key}`} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                    {fmtNum(getSectionTotal(specialExpenses, m.key))}
                                </td>
                            ))}
                        </tr>

                        {/* 전체 합계 행 */}
                        <tr className="bg-orange-100 font-bold border-t border-gray-300 h-[35px]">
                            <td colSpan={2} className="border border-gray-300 px-[10px] text-sm text-center text-orange-900">합계</td>
                            <td className="border border-gray-300 px-[10px] text-right text-sm text-orange-900">
                                {fmtNum(items.reduce((sum, item) => sum + calculateRowTotal(item), 0))}
                            </td>
                            {sortedYears.map(year => (
                                <td key={`grand-sum-year-${year}`} className="border border-gray-300 px-[10px] text-right text-sm text-orange-900">
                                    {fmtNum(items.reduce((sum, item) => sum + calculateRowYearTotal(item, year), 0))}
                                </td>
                            ))}
                            {months.map(m => (
                                <td key={`grand-sum-${m.key}`} className="border border-gray-300 px-[10px] text-right text-sm text-orange-900">
                                    {fmtNum(getGrandTotal(m.key))}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm space-y-2">
                <p className="text-red-600 font-medium">* 인당 계산되는 소모품비 및 음료대는 당사가 "을"로 계약시에는 당사 및 외주 인력을 합하여 승하고 당사가 "병"이하로 계약시에는 당사 인력만 승하시기 바랍니다.</p>
                <p className="text-gray-500">* 일반경비 항목(야근식대, 프로젝트부서비)은 기준-경비 탭에서 설정된 기준액을 투여공수(M/M)와 곱하여 자동 산출됩니다.</p>
            </div>
        </div >
    );
}
