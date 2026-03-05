"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Save, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useManpowerPlan } from "@/hooks/useManpowerPlan";
import type { Project, ProjectUnitPrice } from "@/types/profitability";
import { formatCurrency, Currency } from "@/lib/utils/currency";
import { DatePicker, MonthPicker, Button, Input, Select, Badge, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ManpowerPlanTabProps {
  projectId: number;
  project: Project | null;
  projectUnitPrices: ProjectUnitPrice[];
  currency: Currency;
  status: string;
  onSave?: () => void;
  profitabilityId?: number;
}

const distinctAffiliationGroups = [
  "위엠비_컨설팅",
  "위엠비_개발",
  "외주_컨설팅",
  "외주_개발",
];

const distinctJobLevels = [
  "상무",
  "이사",
  "수석(L)",
  "부장",
  "차부장",
  "수석(S)",
  "차장",
  "책임(M)",
  "과장",
  "책임(A)",
  "대리",
  "사원",
];

const distinctGrades = [
  "개_특",
  "개_고",
  "개_중",
  "개_초",
  "컨_특",
  "컨_고",
  "컨_중",
  "컨_초",
];

interface MonthlyInputProps {
  value: number | undefined;
  onChange: (val: number) => void;
  disabled: boolean;
}

function MonthlyInput({ value, onChange, disabled }: MonthlyInputProps) {
  const [inputValue, setInputValue] = useState(
    value && value !== 0 ? (Math.round(value * 100) / 100).toFixed(2) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  // External updates sync
  useEffect(() => {
    if (!isFocused) {
      if (!value || value === 0) {
        setInputValue("");
      } else {
        setInputValue((Math.round(value * 100) / 100).toFixed(2));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setInputValue(valStr);

    if (valStr === "") {
      onChange(0);
    } else {
      const parsed = parseFloat(valStr);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputValue);

    if (isNaN(parsed) || parsed === 0) {
      setInputValue("");
      onChange(0);
    } else {
      const rounded = Math.round(parsed * 100) / 100;
      if (rounded === 0) {
        setInputValue("");
        onChange(0);
      } else {
        onChange(rounded);
        setInputValue(rounded.toFixed(2));
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled}
      className="w-full h-full text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-0 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}


export function ManpowerPlanTab({
  projectId,
  project,
  projectUnitPrices,
  currency,
  status,
  onSave,
  profitabilityId,
}: ManpowerPlanTabProps) {
  const isReadOnly = status === "COMPLETED" || status === "APPROVED" || status === "review";
  const {
    items,
    users,
    loading,
    saving,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    addRow,
    updateItem,
    deleteRow,
    selectUser,
    saveManpowerPlan,
  } = useManpowerPlan(projectId, projectUnitPrices, project, profitabilityId);

  const { showToast } = useToast();

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await saveManpowerPlan();
      showToast("인력 계획이 저장되었습니다.", "success");
      if (onSave) onSave();
    } catch (error) {
      showToast("인력 계획 저장에 실패했습니다.", "error");
    }
  };

  // 테이블 스크롤 동기화 로직
  const mainTableRef = useRef<HTMLDivElement>(null);
  const analysisTableRef = useRef<HTMLDivElement>(null);

  const handleScroll = (source: 'main' | 'analysis') => {
    const main = mainTableRef.current;
    const analysis = analysisTableRef.current;

    if (!main || !analysis) return;

    if (source === 'main') {
      analysis.scrollLeft = main.scrollLeft;
    } else {
      main.scrollLeft = analysis.scrollLeft;
    }
  };

  // 렌더링을 위한 데이터 준비
  const { startYear, sortedYears, yearGroups, months } = useMemo(() => {
    if (!startMonth || !endMonth) {
      return { startYear: 0, sortedYears: [], yearGroups: {}, months: [] };
    }

    const start = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    const startY = start.getFullYear();

    // 연도별 월 개수 계산
    const groups: { [year: number]: { label: string; count: number } } = {};
    const ms: { key: string; label: string; index: number }[] = [];

    let current = new Date(start);
    let monthIndex = 1;

    while (current <= end) {
      const year = current.getFullYear();
      if (!groups[year]) {
        const yearIndex = year - startY;
        const shortYear = String(year).slice(-2);
        let label = '';
        if (yearIndex === 0) {
          label = `당년(${shortYear}년)`;
        } else if (yearIndex === 1) {
          label = `차년(${shortYear}년)`;
        } else if (yearIndex === 2) {
          label = `차차년(${shortYear}년)`;
        } else {
          label = `${shortYear}년`;
        }
        groups[year] = { label, count: 0 };
      }
      groups[year].count++;

      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${current.getMonth() + 1}월`;

      ms.push({ key: monthKey, label: monthLabel, index: monthIndex });

      current.setMonth(current.getMonth() + 1);
      monthIndex++;
    }

    const sYears = Object.keys(groups).map(Number).sort();

    return { startYear: startY, sortedYears: sYears, yearGroups: groups, months: ms };
  }, [startMonth, endMonth]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">인력 계획을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">인력 계획</h2>
          <p className="mt-1 text-sm text-gray-600">
            프로젝트 기간 동안의 인력 투입 계획을 월별로 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
          </div>
          <div className="flex flex-col justify-end pb-1.5 h-full">
            <span className="text-sm text-gray-500">(단위:천원)</span>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={(e) => handleSave(e)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-default transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
      </div>

      {!project?.contractStartDate && (
        <div className="rounded-md bg-blue-50 p-3 flex items-center justify-between border border-blue-100">
          <p className="text-sm text-blue-700">
            💡 프로젝트 정보에 계약 기간이 설정되어 있지 않습니다. 위에서 직접 기간을 선택하거나 프로젝트 정보에서 설정할 수 있습니다.
          </p>
          <Link
            href={projectId ? `/projects/${projectId}` : "#"}
            className="text-sm font-medium text-blue-800 hover:underline"
          >
            프로젝트 정보 수정 →
          </Link>
        </div>
      )}

      <>
        {/* 1. 인력 계획 메인 테이블 */}
        <div
          ref={mainTableRef}
          onScroll={() => handleScroll('main')}
          className="overflow-x-auto bg-white"
        >
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                <th rowSpan={3} className="min-w-48 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">업무영역</th>
                <th rowSpan={3} className="min-w-24 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">역할</th>
                <th rowSpan={3} className="min-w-60 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">세부업무</th>
                <th rowSpan={3} className="min-w-[106px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">회사명</th>
                <th rowSpan={3} className="min-w-[139px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">소속 및 직군</th>
                <th rowSpan={3} className="min-w-[90px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">위엠비<br />직급</th>
                <th rowSpan={3} className="min-w-[80px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">등급</th>
                <th rowSpan={3} className="min-w-[130px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">성명</th>
                {sortedYears.map((year) => (
                  <th key={year} colSpan={yearGroups[year].count} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                    {yearGroups[year].label}
                  </th>
                ))}
                <th colSpan={1 + sortedYears.length} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                  총투입 M/M
                </th>
                <th colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                  제안가
                </th>
                <th colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                  내부단가
                </th>
              </tr>
              <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                {months.map((m) => (
                  <th key={m.key} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[50px] bg-blue-50/50">
                    {m.label}
                  </th>
                ))}
                <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[60px] bg-blue-50/50">
                  합계
                </th>
                {sortedYears.map((year) => (
                  <th key={`total-mm-${year}`} rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[60px] bg-blue-50/50">
                    {String(year).slice(-2)}년
                  </th>
                ))}
                <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                  단가
                </th>
                <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                  금액
                </th>
                <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                  단가
                </th>
                <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                  금액
                </th>
              </tr>
              <tr className="text-gray-500 h-[35px]">
                {months.map((m) => (
                  <th key={`index-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm font-medium bg-blue-50/50">
                    M{m.index}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item, idx) => {
                const isOutsourcingDev = item.affiliationGroup === "외주_개발";
                const isOutsourcingConsult = item.affiliationGroup === "외주_컨설팅";

                return (
                  <tr key={item.id} className="h-[35px] group bg-white">
                    {idx === 0 && (
                      <td
                        rowSpan={items.length + (!isReadOnly ? 1 : 0) + 1}
                        className="border border-gray-300 px-[10px] text-center text-sm font-medium text-gray-900 bg-white min-w-[180px]"
                      >
                        {project?.name || "프로젝트 미지정"}
                      </td>
                    )}
                    <td className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={item.role || ""}
                        onChange={(e) => updateItem(item.id, "role", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-center text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={item.detailedTask || ""}
                        onChange={(e) => updateItem(item.id, "detailedTask", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={item.companyName || ""}
                        onChange={(e) => updateItem(item.id, "companyName", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-center text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                    <td className="border border-gray-300 p-0">
                      <select
                        value={item.affiliationGroup || ""}
                        onChange={(e) => updateItem(item.id, "affiliationGroup", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">선택</option>
                        {distinctAffiliationGroups.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-0">
                      <select
                        value={item.wmbRank || ""}
                        onChange={(e) => updateItem(item.id, "wmbRank", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">선택</option>
                        {distinctJobLevels.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-0">
                      <select
                        value={item.grade || ""}
                        onChange={(e) => updateItem(item.id, "grade", e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">선택</option>
                        {distinctGrades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-0 relative">
                      <div className="flex items-center h-[35px]">
                        <div className="relative flex-1 h-full">
                          <input
                            type="text"
                            value={item.name || ""}
                            onChange={(e) => selectUser(item.id, e.target.value)}
                            disabled={isReadOnly}
                            placeholder="이름 검색"
                            className="w-full h-[35px] border-none px-[10px] text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                            list={`users-${item.id}`}
                          />
                          <datalist id={`users-${item.id}`}>
                            {users.map((u) => (
                              <option key={u.id} value={u.name}>{u.departmentName} - {u.rankName}</option>
                            ))}
                          </datalist>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => deleteRow(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 mr-1"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    {months.map((m) => (
                      <td key={m.key} className="border border-gray-300 px-[10px] text-center min-w-[50px]">
                        <MonthlyInput
                          value={item.monthlyAllocation[m.key]}
                          onChange={(val) => {
                            const newAlloc = { ...item.monthlyAllocation, [m.key]: val };
                            updateItem(item.id, "monthlyAllocation", newAlloc);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}

                    {/* 투입 M/M 계산 (계 + 연도별) */}
                    <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900 bg-white font-normal">
                      {Object.values(item.monthlyAllocation).reduce((sum, val) => sum + (val || 0), 0).toFixed(2)}
                    </td>
                    {sortedYears.map((year) => {
                      const yearTotal = months
                        .filter((m) => m.key.startsWith(`${year}-`))
                        .reduce((sum, m) => sum + (item.monthlyAllocation[m.key] || 0), 0);
                      return (
                        <td key={`total-mm-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900 bg-white font-normal">
                          {yearTotal.toFixed(2)}
                        </td>
                      );
                    })}

                    {/* 제안가 단가/금액 */}
                    <td className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={item.proposedUnitPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                          updateItem(item.id, "proposedUnitPrice", val);
                        }}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-right text-sm font-normal text-blue-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-blue-400"
                      />
                    </td>
                    <td className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={(() => {
                          const totalMM = Object.values(item.monthlyAllocation).reduce((sum, val) => sum + (val || 0), 0);
                          if (item.proposedAmount !== null && item.proposedAmount !== undefined) {
                            return item.proposedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
                          }
                          if (!item.proposedUnitPrice || isNaN(item.proposedUnitPrice)) return "";
                          const amount = Math.round(totalMM * item.proposedUnitPrice);
                          return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
                        })()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/,/g, ''));
                          updateItem(item.id, "proposedAmount", isNaN(val) ? null : val);
                        }}
                        disabled={isReadOnly}
                        className="w-full h-[35px] border-none px-[10px] text-right text-sm font-normal text-blue-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-blue-400"
                      />
                    </td>

                    {/* 내부단가 단가/금액 */}
                    <td className="border border-gray-300 p-0">
                      {isOutsourcingDev || isOutsourcingConsult ? (
                        <input
                          type="text"
                          value={item.internalUnitPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                            updateItem(item.id, "internalUnitPrice", val);
                          }}
                          disabled={isReadOnly}
                          className="w-full h-[35px] border-none px-[10px] text-right text-sm font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500 text-gray-500"
                        />
                      ) : (
                        <div className="w-full h-[35px] px-[10px] flex items-center justify-end text-sm text-gray-500">
                          {item.internalUnitPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "-"}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-0">
                      {isOutsourcingDev || isOutsourcingConsult ? (
                        <input
                          type="text"
                          value={(() => {
                            const totalMM = Object.values(item.monthlyAllocation).reduce((sum, val) => sum + (val || 0), 0);
                            if (item.internalAmount !== null && item.internalAmount !== undefined) {
                              return item.internalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
                            }
                            if (!item.internalUnitPrice || isNaN(item.internalUnitPrice)) return "";
                            const amount = Math.round(totalMM * item.internalUnitPrice);
                            return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
                          })()}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, ''));
                            updateItem(item.id, "internalAmount", isNaN(val) ? null : val);
                          }}
                          disabled={isReadOnly}
                          className="w-full h-[35px] border-none px-[10px] text-right text-sm font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-500 text-gray-500"
                        />
                      ) : (
                        <div className="w-full h-[35px] px-[10px] flex items-center justify-end text-sm text-gray-600 font-normal">
                          {(() => {
                            const totalMM = Object.values(item.monthlyAllocation).reduce((sum, val) => sum + (val || 0), 0);
                            if (!item.internalUnitPrice || isNaN(item.internalUnitPrice)) return "-";
                            const amount = Math.round(totalMM * item.internalUnitPrice);
                            return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
                          })()}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* 행 추가 버튼 (ProductPlanTab 스타일) */}
              {!isReadOnly && (
                <tr className="h-[35px]">
                  <td className="border border-gray-300 p-0 bg-white h-[35px]" colSpan={7}>
                    <button
                      type="button"
                      onClick={() => addRow()}
                      className="w-full h-full flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium m-0 p-0 rounded-none border-none outline-none focus:outline-none"
                    >
                      <Plus className="h-4 w-4" />
                      인력 추가
                    </button>
                  </td>
                  <td colSpan={months.length + sortedYears.length + 1 + 6} className="border border-gray-300 bg-white"></td>
                </tr>
              )}

              {/* 소계 행 (Subtotal) */}
              <tr className="bg-gray-50 h-[35px]">
                <td colSpan={7} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                  소계
                </td>
                {months.map((m) => {
                  const monthTotal = items.reduce((sum, item) => sum + (item.monthlyAllocation[m.key] || 0), 0);
                  return (
                    <td key={`subtotal-m-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                      {monthTotal > 0 ? monthTotal.toFixed(2) : "-"}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                  {items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0).toFixed(2)}
                </td>
                {sortedYears.map((year) => {
                  const yearTotal = items.reduce((sum, item) => {
                    return sum + months
                      .filter((m) => m.key.startsWith(`${year}-`))
                      .reduce((ysum, m) => ysum + (item.monthlyAllocation[m.key] || 0), 0);
                  }, 0);
                  return (
                    <td key={`subtotal-mm-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                      {yearTotal.toFixed(2)}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                  {(() => {
                    const totalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);
                    const totalProposed = items.reduce((sum, item) => {
                      if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      return sum + (item.proposedUnitPrice ? itemMM * item.proposedUnitPrice : 0);
                    }, 0);
                    const avgProposed = totalMM > 0 ? Math.round(totalProposed / totalMM) : 0;
                    return avgProposed > 0 ? avgProposed.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-";
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-blue-700">
                  {(() => {
                    const totalProposed = items.reduce((sum, item) => {
                      if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      return sum + (item.proposedUnitPrice ? itemMM * item.proposedUnitPrice : 0);
                    }, 0);
                    return Math.round(totalProposed).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                  {(() => {
                    const totalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);
                    const totalInternal = items.reduce((sum, item) => {
                      const isOutsourcing = item.affiliationGroup === "외주_개발" || item.affiliationGroup === "외주_컨설팅";
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) {
                        return sum + item.internalAmount;
                      } else {
                        return sum + (item.internalUnitPrice ? itemMM * item.internalUnitPrice : 0);
                      }
                    }, 0);
                    const avgInternal = totalMM > 0 ? Math.round(totalInternal / totalMM) : 0;
                    return avgInternal > 0 ? avgInternal.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-";
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-600">
                  {(() => {
                    const totalInternal = items.reduce((sum, item) => {
                      const isOutsourcing = item.affiliationGroup === "외주_개발" || item.affiliationGroup === "외주_컨설팅";
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) {
                        return sum + item.internalAmount;
                      } else {
                        return sum + (item.internalUnitPrice ? itemMM * item.internalUnitPrice : 0);
                      }
                    }, 0);
                    return Math.round(totalInternal).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  })()}
                </td>
              </tr>

              {/* 합계 행 (Grand Total) */}
              <tr className="bg-orange-100 h-[35px] font-bold">
                <td colSpan={8} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                  합 계
                </td>
                {months.map((m) => {
                  const monthTotal = items.reduce((sum, item) => sum + (item.monthlyAllocation[m.key] || 0), 0);
                  return (
                    <td key={`total-m-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                      {monthTotal > 0 ? monthTotal.toFixed(2) : "-"}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                  {items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0).toFixed(2)}
                </td>
                {sortedYears.map((year) => {
                  const yearTotal = items.reduce((sum, item) => {
                    return sum + months
                      .filter((m) => m.key.startsWith(`${year}-`))
                      .reduce((ysum, m) => ysum + (item.monthlyAllocation[m.key] || 0), 0);
                  }, 0);
                  return (
                    <td key={`grand-total-mm-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                      {yearTotal.toFixed(2)}
                    </td>
                  );
                })}
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                  {(() => {
                    const totalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);
                    const totalAmount = items.reduce((sum, item) => {
                      if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      return sum + (item.proposedUnitPrice ? itemMM * item.proposedUnitPrice : 0);
                    }, 0);
                    const avgUnitPrice = totalMM > 0 ? Math.round(totalAmount / totalMM) : 0;
                    return avgUnitPrice > 0 ? avgUnitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-";
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-blue-700">
                  {(() => {
                    const totalProposed = items.reduce((sum, item) => {
                      if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      return sum + (item.proposedUnitPrice ? itemMM * item.proposedUnitPrice : 0);
                    }, 0);
                    return Math.round(totalProposed).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                  {(() => {
                    const totalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);
                    const totalInternal = items.reduce((sum, item) => {
                      const isOutsourcing = item.affiliationGroup === "외주_개발" || item.affiliationGroup === "외주_컨설팅";
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) {
                        return sum + item.internalAmount;
                      } else {
                        return sum + (item.internalUnitPrice ? itemMM * item.internalUnitPrice : 0);
                      }
                    }, 0);
                    const avgInternalPrice = totalMM > 0 ? Math.round(totalInternal / totalMM) : 0;
                    return avgInternalPrice > 0 ? avgInternalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-";
                  })()}
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-600">
                  {(() => {
                    const totalInternal = items.reduce((sum, item) => {
                      const isOutsourcing = item.affiliationGroup === "외주_개발" || item.affiliationGroup === "외주_컨설팅";
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) {
                        return sum + item.internalAmount;
                      } else {
                        return sum + (item.internalUnitPrice ? itemMM * item.internalUnitPrice : 0);
                      }
                    }, 0);
                    return Math.round(totalInternal).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  })()}
                </td>
              </tr>

              {/* 부가세 포함 행 */}
              <tr className="bg-red-50 h-[35px]">
                <td colSpan={8 + months.length + sortedYears.length + 1 + 1} className="border border-gray-300 px-[10px] text-right text-sm text-gray-900 border-r-0">
                  부가세 포함
                </td>
                <td className="border border-gray-300 px-[10px] text-right text-sm text-red-700 font-bold border-l-0">
                  {(() => {
                    const grandTotal = items.reduce((sum, item) => {
                      if (item.proposedAmount !== null && item.proposedAmount !== undefined) {
                        return sum + item.proposedAmount;
                      }
                      const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                      return sum + (item.proposedUnitPrice ? itemMM * item.proposedUnitPrice : 0);
                    }, 0);
                    return Math.round(grandTotal * 1.1).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  })()}
                </td>
                <td colSpan={2} className="border border-gray-300 bg-red-50"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. 분석 섹션 테이블 (업체별-등급별 매출 및 원가) */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-gray-900">분석 : 업체별-등급별 매출 및 원가</h2>
          </div>
          <div
            ref={analysisTableRef}
            onScroll={() => handleScroll('analysis')}
            className="overflow-x-auto bg-white"
          >
            <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                  <th rowSpan={3} className="min-w-48 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">업무영역</th>
                  <th rowSpan={3} className="min-w-24 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">역할</th>
                  <th rowSpan={3} className="min-w-60 border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">세부업무</th>
                  <th rowSpan={3} className="min-w-[106px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">회사명</th>
                  <th rowSpan={3} className="min-w-[139px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">소속 및 직군</th>
                  <th rowSpan={3} className="min-w-[90px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">위엠비<br />직급</th>
                  <th rowSpan={3} className="min-w-[80px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">등급</th>
                  <th rowSpan={3} className="min-w-[130px] border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">성명</th>
                  {sortedYears.map((year) => (
                    <th key={year} colSpan={yearGroups[year].count} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                      {yearGroups[year].label}
                    </th>
                  ))}
                  <th colSpan={1 + sortedYears.length} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                    총투입 M/M
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                    제안가
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-blue-50/50">
                    내부단가
                  </th>
                </tr>
                <tr className="text-gray-900 border-b border-gray-300 h-[35px]">
                  {months.map((m) => (
                    <th key={m.key} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[50px] bg-blue-50/50">
                      {m.label}
                    </th>
                  ))}
                  <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[60px] bg-blue-50/50">
                    합계
                  </th>
                  {sortedYears.map((year) => (
                    <th key={`total-mm-${year}`} rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[60px] bg-blue-50/50">
                      {String(year).slice(-2)}년
                    </th>
                  ))}
                  <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                    단가
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                    금액
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                    단가
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-medium min-w-[90px] bg-blue-50/50">
                    금액
                  </th>
                </tr>
                <tr className="text-gray-500 h-[35px]">
                  {months.map((m) => (
                    <th key={`index-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm font-medium bg-blue-50/50">
                      M{m.index}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* Analysis Content Rows */}
                {(() => {
                  // Define fixed structure for Analysis Table rows
                  const FIXED_ROLES: Record<string, string[]> = {
                    "위엠비_컨설팅": ["상무", "이사", "수석(L)", "수석(S)", "책임(M)", "책임(A)", "사원"],
                    "위엠비_개발": ["상무", "이사", "수석(L)", "수석(S)", "책임(M)", "책임(A)", "사원"],
                    "외주_컨설팅": ["컨_특", "컨_고", "컨_중", "컨_초"],
                    "외주_개발": ["개_특", "개_고", "개_중", "개_초"]
                  };

                  const uniqueRoles: { affiliation: string; rank: string; isExternal: boolean }[] = [];

                  // Use distinctAffiliationGroups to determine WHICH sections to render, 
                  // but use FIXED_ROLES to determine the rows INSIDE the section.
                  let targetAffiliations = distinctAffiliationGroups.filter(aff => FIXED_ROLES[aff]);

                  // Sort affiliations: WMB first, then Outsourcing
                  const affOrder = ["위엠비_컨설팅", "위엠비_개발", "외주_컨설팅", "외주_개발"];
                  targetAffiliations.sort((a, b) => affOrder.indexOf(a) - affOrder.indexOf(b));

                  targetAffiliations.forEach(aff => {
                    const definedRanks = FIXED_ROLES[aff];
                    const isExternal = aff.startsWith("외주");
                    definedRanks.forEach(rank => {
                      uniqueRoles.push({
                        affiliation: aff,
                        rank: rank,
                        isExternal: isExternal
                      });
                    });
                  });

                  // Sort based on predefined order
                  uniqueRoles.sort((a, b) => {
                    const affIndexA = distinctAffiliationGroups.indexOf(a.affiliation);
                    const affIndexB = distinctAffiliationGroups.indexOf(b.affiliation);

                    if (affIndexA !== affIndexB) {
                      if (affIndexA === -1) return 1;
                      if (affIndexB === -1) return -1;
                      return affIndexA - affIndexB;
                    }

                    if (a.isExternal) {
                      return distinctGrades.indexOf(a.rank) - distinctGrades.indexOf(b.rank);
                    }
                    return distinctJobLevels.indexOf(a.rank) - distinctJobLevels.indexOf(b.rank);
                  });

                  const wembRows = uniqueRoles.filter(r => !r.isExternal);
                  const externalRows = uniqueRoles.filter(r => r.isExternal);

                  const getSectionAffiliations = (rows: typeof uniqueRoles) => Array.from(new Set(rows.map(r => r.affiliation)));
                  const wembAffs = getSectionAffiliations(wembRows);
                  const externalAffs = getSectionAffiliations(externalRows);

                  let analysisGrandTotalMM = 0;
                  let analysisGrandTotalProposed = 0;
                  let analysisGrandTotalInternal = 0;
                  const analysisMonthlyTotals: { [key: string]: number } = {};
                  months.forEach(m => analysisMonthlyTotals[m.key] = 0);
                  const analysisYearTotals: { [year: number]: number } = {};
                  sortedYears.forEach(y => analysisYearTotals[y] = 0);

                  const totalAnalysisRows =
                    (wembRows.length > 0 ? wembRows.length + wembAffs.length + 1 : 0) +
                    (externalRows.length > 0 ? externalRows.length + externalAffs.length + 1 : 0) +
                    2; // Grand Total + Check Row

                  // Helper to render currency or dash
                  const fmtNum = (n: number) => n > 0 ? n.toLocaleString() : "-";

                  const renderSection = (title: string, rows: typeof uniqueRoles, isFirstSection: boolean) => {
                    if (rows.length === 0) return null;

                    const sectionMonthlyTotals: { [key: string]: number } = {};
                    months.forEach(m => sectionMonthlyTotals[m.key] = 0);
                    const sectionYearTotals: { [year: number]: number } = {};
                    sortedYears.forEach(y => sectionYearTotals[y] = 0);

                    let sectionTotalMM = 0;
                    let sectionProposedAmount = 0;
                    let sectionInternalAmount = 0;

                    const getRoleValues = (aff: string, rank: string) => {
                      const monthlyData: { [key: string]: number } = {};
                      const yearData: { [year: number]: number } = {};
                      sortedYears.forEach(y => yearData[y] = 0);
                      let rowTotalMM = 0;
                      let rowProposedAmount = 0;
                      let rowInternalAmount = 0;

                      const groupItems = items.filter(item => {
                        if (item.affiliationGroup !== aff) return false;
                        const isExternal = aff.startsWith("외주");
                        let itemRank = isExternal ? item.grade : item.wmbRank;

                        if (isExternal && itemRank) {
                          const isConsulting = aff === "외주_컨설팅";
                          const prefix = isConsulting ? "컨" : "개";

                          // If itemRank already contains the prefix (e.g., '개_특'), use it as is.
                          // Otherwise, map legacy grades (e.g., '특급') to the new format.
                          if (!itemRank.includes("_")) {
                            const gradeSuffix = itemRank === "특급" ? "특" :
                              itemRank === "고급" ? "고" :
                                itemRank === "중급" ? "중" :
                                  itemRank === "초급" ? "초" : itemRank;
                            itemRank = `${prefix}_${gradeSuffix}`;
                          }
                        }
                        return itemRank === rank;
                      });

                      // Gather monthly values and aggregate by year
                      months.forEach(m => {
                        const sum = groupItems.reduce((acc, item) => acc + (item.monthlyAllocation[m.key] || 0), 0);
                        monthlyData[m.key] = sum;
                        rowTotalMM += sum;
                        sectionMonthlyTotals[m.key] += sum;

                        const y = parseInt(m.key.split('-')[0]);
                        if (yearData.hasOwnProperty(y)) {
                          yearData[y] += sum;
                          sectionYearTotals[y] += sum;
                        }
                      });
                      sectionTotalMM += rowTotalMM;

                      groupItems.forEach(item => {
                        const itemTotalMM = Object.values(item.monthlyAllocation).reduce((s, v) => s + (v || 0), 0);
                        if (item.proposedAmount !== null && item.proposedAmount !== undefined) {
                          rowProposedAmount += item.proposedAmount;
                        } else if (item.proposedUnitPrice) {
                          rowProposedAmount += Math.round(itemTotalMM * item.proposedUnitPrice);
                        }

                        const isOutsourcing = aff?.startsWith("외주");
                        if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) {
                          rowInternalAmount += item.internalAmount;
                        } else {
                          rowInternalAmount += (item.internalUnitPrice ? Math.round(itemTotalMM * item.internalUnitPrice) : 0);
                        }
                      });
                      sectionProposedAmount += rowProposedAmount;
                      sectionInternalAmount += rowInternalAmount;

                      const sumProposedPrice = groupItems.reduce((acc, item) => {
                        return acc + (item.proposedUnitPrice || 0);
                      }, 0);

                      const sumInternalPrice = groupItems.reduce((acc, item) => {
                        return acc + (item.internalUnitPrice || 0);
                      }, 0);

                      return { monthlyData, yearData, rowTotalMM, rowProposedAmount, rowInternalAmount, avgProposedPrice: sumProposedPrice, avgInternalPrice: sumInternalPrice };
                    };

                    const affGroups = Array.from(new Set(rows.map(r => r.affiliation)));

                    return (
                      <>
                        {affGroups.map((affiliation, affIdx) => {
                          const affRows = rows.filter(r => r.affiliation === affiliation);
                          const affMonthlyTotals: { [key: string]: number } = {};
                          months.forEach(m => affMonthlyTotals[m.key] = 0);
                          const affYearTotals: { [year: number]: number } = {};
                          sortedYears.forEach(y => affYearTotals[y] = 0);
                          let affTotalMM = 0;
                          let affProposedAmount = 0;
                          let affInternalAmount = 0;

                          return (
                            <React.Fragment key={affiliation}>
                              {affRows.map((row, rowIdx) => {
                                const vals = getRoleValues(row.affiliation, row.rank);
                                affTotalMM += vals.rowTotalMM;
                                affProposedAmount += vals.rowProposedAmount;
                                affInternalAmount += vals.rowInternalAmount;
                                months.forEach(m => affMonthlyTotals[m.key] += vals.monthlyData[m.key]);
                                sortedYears.forEach(y => affYearTotals[y] += vals.yearData[y]);

                                return (
                                  <tr key={`${row.affiliation}-${row.rank}`} className="h-[35px] bg-white">
                                    {affIdx === 0 && rowIdx === 0 && (
                                      <>
                                        {isFirstSection && (
                                          <td rowSpan={totalAnalysisRows} colSpan={3} className="border border-gray-300 bg-white"></td>
                                        )}
                                        <td rowSpan={rows.length + affGroups.length + 1} className="border border-gray-300 px-[10px] text-center text-sm font-bold bg-white">
                                          {title}
                                        </td>
                                      </>
                                    )}
                                    <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-600 bg-white">
                                      {row.affiliation}
                                    </td>
                                    <td colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm text-gray-600 bg-white">
                                      {row.rank}
                                    </td>
                                    <td className="border border-gray-300 px-[10px] bg-white"></td>
                                    {months.map(m => (
                                      <td key={m.key} className="border border-gray-300 px-[10px] text-center text-sm text-gray-500 bg-white">
                                        {vals.monthlyData[m.key] > 0 ? vals.monthlyData[m.key].toFixed(2) : ""}
                                      </td>
                                    ))}
                                    <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900 bg-white">
                                      {vals.rowTotalMM > 0 ? vals.rowTotalMM.toFixed(2) : ""}
                                    </td>
                                    {sortedYears.map(year => (
                                      <td key={`an-year-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900 bg-white">
                                        {vals.yearData[year] > 0 ? vals.yearData[year].toFixed(2) : ""}
                                      </td>
                                    ))}
                                    <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-600">
                                      {vals.avgProposedPrice > 0 ? vals.avgProposedPrice.toLocaleString() : "-"}
                                    </td>
                                    <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                      {fmtNum(vals.rowProposedAmount)}
                                    </td>
                                    <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-500">
                                      {vals.avgInternalPrice > 0 ? vals.avgInternalPrice.toLocaleString() : "-"}
                                    </td>
                                    <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-800">
                                      {fmtNum(vals.rowInternalAmount)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Affiliation Subtotal */}
                              <tr className="h-[35px] bg-gray-50">
                                <td colSpan={4} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                                  {affiliation} 소계
                                </td>
                                {months.map(m => (
                                  <td key={`aff-sum-${affiliation}-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                                    {affMonthlyTotals[m.key] > 0 ? affMonthlyTotals[m.key].toFixed(2) : ""}
                                  </td>
                                ))}
                                <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                                  {affTotalMM > 0 ? affTotalMM.toFixed(2) : ""}
                                </td>
                                {sortedYears.map(year => (
                                  <td key={`aff-year-sum-${affiliation}-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                                    {affYearTotals[year] > 0 ? affYearTotals[year].toFixed(2) : ""}
                                  </td>
                                ))}
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                  {affTotalMM > 0 ? Math.round(affProposedAmount / affTotalMM).toLocaleString() : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                  {affProposedAmount.toLocaleString()}
                                </td>
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                  {affTotalMM > 0 ? Math.round(affInternalAmount / affTotalMM).toLocaleString() : "-"}
                                </td>
                                <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                                  {affInternalAmount.toLocaleString()}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}

                        {/* Section Subtotal */}
                        {(() => {
                          analysisGrandTotalMM += sectionTotalMM;
                          analysisGrandTotalProposed += sectionProposedAmount;
                          analysisGrandTotalInternal += sectionInternalAmount;
                          months.forEach(m => analysisMonthlyTotals[m.key] += sectionMonthlyTotals[m.key]);
                          sortedYears.forEach(y => analysisYearTotals[y] += sectionYearTotals[y]);
                          return null;
                        })()}
                        <tr className="h-[35px] bg-gray-100">
                          <td colSpan={4} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                            {title === "당사" ? "당사 합계" : "외주 합계"}
                          </td>
                          {months.map(m => (
                            <td key={m.key} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                              {sectionMonthlyTotals[m.key] > 0 ? sectionMonthlyTotals[m.key].toFixed(2) : ""}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                            {sectionTotalMM > 0 ? sectionTotalMM.toFixed(2) : ""}
                          </td>
                          {sortedYears.map(year => (
                            <td key={`sub-an-year-${year}`} className="border border-gray-300 px-[10px] text-center text-sm text-gray-900">
                              {sectionYearTotals[year] > 0 ? sectionYearTotals[year].toFixed(2) : ""}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                            {sectionTotalMM > 0 ? Math.round(sectionProposedAmount / sectionTotalMM).toLocaleString() : "-"}
                          </td>
                          <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                            {fmtNum(sectionProposedAmount)}
                          </td>
                          <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                            {sectionTotalMM > 0 ? Math.round(sectionInternalAmount / sectionTotalMM).toLocaleString() : "-"}
                          </td>
                          <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900">
                            {fmtNum(sectionInternalAmount)}
                          </td>
                        </tr>
                      </>
                    );
                  };

                  const grandTotalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);

                  const grandTotalProposed = items.reduce((sum, item) => {
                    if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                    const totalMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                    return sum + (item.proposedUnitPrice ? Math.round(totalMM * item.proposedUnitPrice) : 0);
                  }, 0);

                  const grandTotalInternal = items.reduce((sum, item) => {
                    const isOutsourcing = item.affiliationGroup?.startsWith("외주");
                    if (isOutsourcing && item.internalAmount !== null && item.internalAmount !== undefined) return sum + item.internalAmount;
                    const totalMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                    return sum + (item.internalUnitPrice ? Math.round(totalMM * item.internalUnitPrice) : 0);
                  }, 0);

                  return (
                    <>
                      {renderSection("당사", wembRows, true)}
                      {renderSection("외주", externalRows, false)}

                      {/* Grand Total Row */}
                      <tr className="bg-orange-100 h-[35px]">
                        <td colSpan={5} className="border border-gray-300 px-[10px] text-center text-sm font-bold text-gray-900">
                          합계
                        </td>
                        {months.map(m => (
                          <td key={`analysis-grand-m-${m.key}`} className="border border-gray-300 px-[10px] text-center text-sm font-bold text-gray-900">
                            {analysisMonthlyTotals[m.key] > 0 ? analysisMonthlyTotals[m.key].toFixed(2) : ""}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-[10px] text-center text-sm font-bold text-gray-900">
                          {analysisGrandTotalMM > 0 ? analysisGrandTotalMM.toFixed(2) : ""}
                        </td>
                        {sortedYears.map(year => (
                          <td key={`analysis-grand-year-${year}`} className="border border-gray-300 px-[10px] text-center text-sm font-bold text-gray-900">
                            {analysisYearTotals[year] > 0 ? analysisYearTotals[year].toFixed(2) : ""}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-[10px] text-right text-sm font-bold text-gray-900">
                          {analysisGrandTotalMM > 0 ? Math.round(analysisGrandTotalProposed / analysisGrandTotalMM).toLocaleString() : "-"}
                        </td>
                        <td className="border border-gray-300 px-[10px] text-right text-sm font-bold text-gray-900">
                          {analysisGrandTotalProposed.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-[10px] text-right text-sm font-bold text-gray-900">
                          {analysisGrandTotalMM > 0 ? Math.round(analysisGrandTotalInternal / analysisGrandTotalMM).toLocaleString() : "-"}
                        </td>
                        <td className="border border-gray-300 px-[10px] text-right text-sm font-bold text-gray-900">
                          {analysisGrandTotalInternal.toLocaleString()}
                        </td>
                      </tr>

                      {/* Check Row */}
                      <tr className="h-[35px] bg-blue-50">
                        <td colSpan={5} className="border border-gray-300 px-[10px] text-center text-sm font-bold text-blue-900">
                          검증
                        </td>
                        {months.map(m => {
                          const mainTotal = items.reduce((sum, item) => sum + (item.monthlyAllocation[m.key] || 0), 0);
                          const analysisTotal = analysisMonthlyTotals[m.key];
                          const diff = mainTotal - analysisTotal;
                          const hasError = Math.abs(diff) > 0.01;
                          return (
                            <td key={`check-m-${m.key}`} className={`border border-gray-300 px-[10px] text-center text-sm ${hasError ? 'text-red-600 font-bold' : 'text-blue-900'}`}>
                              {Math.abs(diff) > 0.01 ? diff.toFixed(2) : "0"}
                            </td>
                          );
                        })}
                        <td className={`border border-gray-300 px-[10px] text-center text-sm ${Math.abs(items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0) - analysisGrandTotalMM) > 0.01 ? 'text-red-600 font-bold' : 'text-blue-900'}`}>
                          {(() => {
                            const mainTotalMM = items.reduce((sum, item) => sum + Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0), 0);
                            const diff = mainTotalMM - analysisGrandTotalMM;
                            return Math.abs(diff) > 0.01 ? diff.toFixed(2) : "0";
                          })()}
                        </td>
                        {sortedYears.map(year => {
                          const mainYearTotal = items.reduce((sum, item) => {
                            return sum + months
                              .filter((m) => m.key.startsWith(`${year}-`))
                              .reduce((ysum, m) => ysum + (item.monthlyAllocation[m.key] || 0), 0);
                          }, 0);
                          const diff = mainYearTotal - analysisYearTotals[year];
                          const hasError = Math.abs(diff) > 0.01;
                          return (
                            <td key={`check-year-${year}`} className={`border border-gray-300 px-[10px] text-center text-sm ${hasError ? 'text-red-600 font-bold' : 'text-blue-900'}`}>
                              {Math.abs(diff) > 0.01 ? diff.toFixed(2) : "0"}
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 px-[10px] bg-blue-50"></td>
                        <td className={`border border-gray-300 px-[10px] text-right text-sm ${Math.abs(items.reduce((sum, item) => { if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount; const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0); return sum + (item.proposedUnitPrice ? Math.round(itemMM * item.proposedUnitPrice) : 0); }, 0) - analysisGrandTotalProposed) > 1 ? 'text-red-600 font-bold' : 'text-blue-900'}`}>
                          {(() => {
                            const mainTotalProp = items.reduce((sum, item) => {
                              if (item.proposedAmount !== null && item.proposedAmount !== undefined) return sum + item.proposedAmount;
                              const itemMM = Object.values(item.monthlyAllocation).reduce((isum, val) => isum + (val || 0), 0);
                              return sum + (item.proposedUnitPrice ? Math.round(itemMM * item.proposedUnitPrice) : 0);
                            }, 0);
                            const diff = mainTotalProp - analysisGrandTotalProposed;
                            return Math.abs(diff) > 1 ? diff.toLocaleString() : "0";
                          })()}
                        </td>
                        <td className="border border-gray-300 px-[10px] bg-blue-50"></td>
                        <td className={`border border-gray-300 px-[10px] text-right text-sm ${Math.abs(grandTotalInternal - analysisGrandTotalInternal) > 1 ? 'text-red-600 font-bold' : 'text-blue-900'}`}>
                          {(() => {
                            const diff = grandTotalInternal - analysisGrandTotalInternal;
                            return Math.abs(diff) > 1 ? diff.toLocaleString() : "0";
                          })()}
                        </td>
                      </tr>
                    </>
                  );
                })()
                }
              </tbody>
            </table>
          </div>
        </div>
      </>
    </div>
  );
}