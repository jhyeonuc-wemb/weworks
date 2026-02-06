"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  Copy,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface UnitPrice {
  id: number;
  affiliationGroup: string;
  jobGroup: string;
  jobLevel: string;
  grade: string;
  year: number;
  proposedStandard: number | null;
  proposedApplied: number | null;
  proposedDiscountRate: number | null;
  internalApplied: number | null;
  internalIncreaseRate: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const AFFILIATION_GROUPS = [
  "위엠비_컨설팅",
  "위엠비_개발",
  "외주_컨설팅",
  "외주_개발",
];

const JOB_GROUPS = ["컨설팅", "개발", "컨_특", "컨_고", "컨_중", "컨_초", "개_특", "개_고", "개_중", "개_초"];

const JOB_LEVELS = [
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

const GRADES = ["특급", "고급", "중급", "초급"];

const YEARS = [2027, 2026, 2025, 2024];

export interface UnitPriceLaborTabProps {
  onAddClick?: () => void;
}

export interface UnitPriceLaborTabHandle {
  handleAdd: () => void;
}

export const UnitPriceLaborTab = forwardRef<UnitPriceLaborTabHandle, UnitPriceLaborTabProps>((props, ref) => {
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<UnitPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterAffiliation, setFilterAffiliation] = useState<string>("");
  const [copyYearModal, setCopyYearModal] = useState(false);
  const [copySourceYear, setCopySourceYear] = useState<string>("");
  const [copyTargetYear, setCopyTargetYear] = useState<string>("");
  const [isCopying, setIsCopying] = useState(false);

  const [formData, setFormData] = useState<Partial<UnitPrice>>({
    affiliationGroup: "",
    jobGroup: "",
    jobLevel: "",
    grade: "",
    year: 2026,
    proposedStandard: null,
    proposedApplied: null,
    proposedDiscountRate: null,
    internalApplied: null,
    internalIncreaseRate: null,
    isActive: true,
    displayOrder: 0,
  });

  const [numberInputValues, setNumberInputValues] = useState<{
    proposedStandard: string;
    proposedApplied: string;
    internalApplied: string;
  }>({
    proposedStandard: "",
    proposedApplied: "",
    internalApplied: "",
  });

  useEffect(() => {
    fetchUnitPrices();
  }, []);

  useImperativeHandle(ref, () => ({
    handleAdd
  }));

  const availableYears = Array.from(
    new Set(unitPrices.map((p) => p.year))
  ).sort((a, b) => b - a);

  useEffect(() => {
    let filtered = unitPrices;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (price) =>
          price.affiliationGroup.toLowerCase().includes(query) ||
          price.jobGroup.toLowerCase().includes(query) ||
          price.jobLevel.toLowerCase().includes(query) ||
          price.grade.toLowerCase().includes(query)
      );
    }

    if (filterYear) {
      filtered = filtered.filter((price) => price.year === parseInt(filterYear, 10));
    }

    if (filterAffiliation) {
      filtered = filtered.filter(
        (price) => price.affiliationGroup === filterAffiliation
      );
    }

    filtered.sort((a, b) => {
      const orderA = AFFILIATION_GROUPS.indexOf(a.affiliationGroup);
      const orderB = AFFILIATION_GROUPS.indexOf(b.affiliationGroup);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      if (a.jobGroup !== b.jobGroup) {
        const jobGroupOrderA = JOB_GROUPS.indexOf(a.jobGroup);
        const jobGroupOrderB = JOB_GROUPS.indexOf(b.jobGroup);
        return jobGroupOrderA - jobGroupOrderB;
      }
      const jobLevelOrder = JOB_LEVELS.indexOf(a.jobLevel) - JOB_LEVELS.indexOf(b.jobLevel);
      if (jobLevelOrder !== 0) {
        return jobLevelOrder;
      }
      return GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
    });

    setFilteredPrices(filtered);
  }, [unitPrices, searchQuery, filterYear, filterAffiliation]);

  const calculateGroupAverages = (prices: UnitPrice[], allPrices: UnitPrice[] = unitPrices) => {
    const groups = new Map<string, UnitPrice[]>();

    prices.forEach((price) => {
      const key = price.affiliationGroup;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(price);
    });

    const averages: Array<{
      affiliationGroup: string;
      averageProposedApplied: number | null;
      averageDiscountRate: number | null;
      averageInternalApplied: number | null;
      averageIncreaseRate: number | null;
    }> = [];

    groups.forEach((groupPrices, affiliationGroup) => {
      const validProposedApplied = groupPrices.filter((p) => p.proposedApplied !== null && p.proposedApplied !== undefined);
      const avgProposedApplied = validProposedApplied.length > 0
        ? Math.round(validProposedApplied.reduce((acc, p) => acc + (p.proposedApplied || 0), 0) / validProposedApplied.length)
        : null;

      const validDiscountRates = groupPrices
        .map((p) => calculateDiscountRate(p.proposedStandard, p.proposedApplied))
        .filter((rate) => rate !== null) as number[];
      const avgDiscountRate = validDiscountRates.length > 0
        ? validDiscountRates.reduce((acc, rate) => acc + rate, 0) / validDiscountRates.length
        : null;

      const validInternalApplied = groupPrices.filter((p) => p.internalApplied !== null && p.internalApplied !== undefined);
      const avgInternalApplied = validInternalApplied.length > 0
        ? Math.round(validInternalApplied.reduce((acc, p) => acc + (p.internalApplied || 0), 0) / validInternalApplied.length)
        : null;

      const validIncreaseRates = groupPrices
        .map((p) => {
          if (!p.internalApplied || !p.year) return null;
          const previousYear = p.year - 1;
          const previousYearPrice = allPrices.find(
            (prev) =>
              prev.affiliationGroup === p.affiliationGroup &&
              prev.jobGroup === p.jobGroup &&
              prev.jobLevel === p.jobLevel &&
              prev.grade === p.grade &&
              prev.year === previousYear
          );
          if (!previousYearPrice || !previousYearPrice.internalApplied) return null;
          return ((p.internalApplied - previousYearPrice.internalApplied) / previousYearPrice.internalApplied) * 100;
        })
        .filter((rate) => rate !== null) as number[];
      const avgIncreaseRate = validIncreaseRates.length > 0
        ? validIncreaseRates.reduce((acc, rate) => acc + rate, 0) / validIncreaseRates.length
        : null;

      averages.push({
        affiliationGroup,
        averageProposedApplied: avgProposedApplied,
        averageDiscountRate: avgDiscountRate,
        averageInternalApplied: avgInternalApplied,
        averageIncreaseRate: avgIncreaseRate,
      });
    });

    return averages;
  };

  const calculateDiscountRate = (
    proposedStandard: number | null | undefined,
    proposedApplied: number | null | undefined
  ): number | null => {
    if (
      proposedStandard === null ||
      proposedStandard === undefined ||
      proposedApplied === null ||
      proposedApplied === undefined ||
      proposedStandard === 0
    ) {
      return null;
    }
    return ((proposedStandard - proposedApplied) / proposedStandard) * 100;
  };

  const formatNumberWithCommas = (value: string): string => {
    const cleaned = value.replace(/[^\d]/g, "");
    if (!cleaned) return "";
    const number = parseInt(cleaned, 10);
    return number.toLocaleString();
  };

  const parseNumberFromString = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const fetchUnitPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/unit-prices");
      if (response.ok) {
        const data = await response.json();
        setUnitPrices(data.unitPrices || []);
      }
    } catch (error) {
      console.error("Error fetching unit prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      affiliationGroup: "",
      jobGroup: "",
      jobLevel: "",
      grade: "",
      year: currentYear,
      proposedStandard: null,
      proposedApplied: null,
      proposedDiscountRate: null,
      internalApplied: null,
      internalIncreaseRate: null,
      isActive: true,
      displayOrder: 0,
    });
    setNumberInputValues({
      proposedStandard: "",
      proposedApplied: "",
      internalApplied: "",
    });
  };

  const handleEdit = (price: UnitPrice) => {
    setEditingId(price.id);
    setIsAdding(false);
    setFormData({
      affiliationGroup: price.affiliationGroup,
      jobGroup: price.jobGroup,
      jobLevel: price.jobLevel,
      grade: price.grade,
      year: price.year,
      proposedStandard: price.proposedStandard,
      proposedApplied: price.proposedApplied,
      proposedDiscountRate: price.proposedDiscountRate,
      internalApplied: price.internalApplied,
      internalIncreaseRate: price.internalIncreaseRate,
      isActive: price.isActive,
      displayOrder: price.displayOrder,
    });
    setNumberInputValues({
      proposedStandard: price.proposedStandard !== null ? price.proposedStandard.toLocaleString() : "",
      proposedApplied: price.proposedApplied !== null ? price.proposedApplied.toLocaleString() : "",
      internalApplied: price.internalApplied !== null ? price.internalApplied.toLocaleString() : "",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      affiliationGroup: "",
      jobGroup: "",
      jobLevel: "",
      grade: "",
      year: currentYear,
      proposedStandard: null,
      proposedApplied: null,
      proposedDiscountRate: null,
      internalApplied: null,
      internalIncreaseRate: null,
      isActive: true,
      displayOrder: 0,
    });
    setNumberInputValues({
      proposedStandard: "",
      proposedApplied: "",
      internalApplied: "",
    });
  };

  const handleSave = async () => {
    if (
      !formData.affiliationGroup ||
      !formData.jobGroup ||
      !formData.jobLevel ||
      !formData.grade ||
      !formData.year
    ) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const url = isAdding
        ? "/api/unit-prices"
        : `/api/unit-prices/${editingId}`;
      const method = isAdding ? "POST" : "PUT";

      const proposedDiscountRate = calculateDiscountRate(
        formData.proposedStandard,
        formData.proposedApplied
      );

      let internalIncreaseRate = null;
      if (formData.internalApplied && formData.year) {
        const previousYear = formData.year - 1;
        const previousYearPrice = unitPrices.find(
          (p) =>
            p.affiliationGroup === formData.affiliationGroup &&
            p.jobGroup === formData.jobGroup &&
            p.jobLevel === formData.jobLevel &&
            p.grade === formData.grade &&
            p.year === previousYear
        );
        if (previousYearPrice && previousYearPrice.internalApplied) {
          internalIncreaseRate =
            ((formData.internalApplied - previousYearPrice.internalApplied) /
              previousYearPrice.internalApplied) *
            100;
        }
      }

      const payload = {
        ...formData,
        proposedDiscountRate,
        internalIncreaseRate,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchUnitPrices();
        handleCancel();
        alert(isAdding ? "기준단가가 추가되었습니다." : "기준단가가 수정되었습니다.");
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error saving unit price:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/unit-prices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUnitPrices();
        alert("기준단가가 삭제되었습니다.");
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error deleting unit price:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleCopyYear = async () => {
    if (!copySourceYear || !copyTargetYear) {
      alert("복사할 연도와 목적지 연도를 선택해주세요.");
      return;
    }

    if (copySourceYear === copyTargetYear) {
      alert("같은 연도는 복사할 수 없습니다.");
      return;
    }

    if (!window.confirm(`${copySourceYear}년 데이터를 ${copyTargetYear}년으로 복사하시겠습니까?`)) {
      return;
    }

    setIsCopying(true);
    try {
      const response = await fetch("/api/unit-prices/copy-year", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceYear: parseInt(copySourceYear, 10),
          targetYear: parseInt(copyTargetYear, 10),
        }),
      });

      if (response.ok) {
        await fetchUnitPrices();
        setCopyYearModal(false);
        setCopySourceYear("");
        setCopyTargetYear("");
        alert("연도 데이터가 복사되었습니다.");
      } else {
        const error = await response.json();
        alert(`복사 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error copying year:", error);
      alert(`복사 실패: ${error.message}`);
    } finally {
      setIsCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* 필터 및 검색 - Neo Modern Style */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-1">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="소속, 직군, 직급, 등급으로 고정밀 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[1.25rem] border border-border/40 bg-white py-4 pl-12 pr-6 text-sm font-semibold shadow-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:outline-none transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="rounded-2xl border border-border/40 bg-white px-5 py-4 text-sm font-bold text-foreground/70 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all cursor-pointer min-w-[130px]"
          >
            <option value="">전체 연도</option>
            {availableYears.length > 0
              ? availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))
              : YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
          </select>
          <select
            value={filterAffiliation}
            onChange={(e) => setFilterAffiliation(e.target.value)}
            className="rounded-2xl border border-border/40 bg-white px-5 py-4 text-sm font-bold text-foreground/70 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all cursor-pointer min-w-[160px]"
          >
            <option value="">전체 소속</option>
            {AFFILIATION_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCopyYearModal(true)}
            className="inline-flex items-center gap-2.5 rounded-2xl border border-border/40 bg-white px-6 py-4 text-sm font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all active:scale-95 shadow-sm"
          >
            <Copy className="h-4 w-4" />
            연도 복사
          </button>
        </div>
      </div>

      {/* 추가/수정 모달 - Neo Integrated */}
      {(isAdding || editingId !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={handleCancel} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] border border-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="border-b border-border/40 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {isAdding ? "신규 인력 단가 등록" : "인력 단가 속성 수정"}
                  </h2>
                </div>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    소속 그룹 <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.affiliationGroup || ""}
                    onChange={(e) => setFormData({ ...formData, affiliationGroup: e.target.value })}
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    required
                  >
                    <option value="">소속 선택</option>
                    {AFFILIATION_GROUPS.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    직군 <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.jobGroup || ""}
                    onChange={(e) => setFormData({ ...formData, jobGroup: e.target.value })}
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    required
                  >
                    <option value="">직군 선택</option>
                    {JOB_GROUPS.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    직급 <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.jobLevel || ""}
                    onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    required
                  >
                    <option value="">직급 선택</option>
                    {JOB_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    등급 <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.grade || ""}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    required
                  >
                    <option value="">등급 선택</option>
                    {GRADES.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    기준 연도 <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.year || currentYear}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                    required
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    제시 표준 단가 (천원)
                  </label>
                  <input
                    type="text"
                    value={numberInputValues.proposedStandard}
                    onChange={(e) => {
                      const formattedValue = formatNumberWithCommas(e.target.value);
                      setNumberInputValues({ ...numberInputValues, proposedStandard: formattedValue });
                      const numValue = parseNumberFromString(e.target.value);
                      const cleanedValue = e.target.value.replace(/,/g, "").trim();
                      setFormData({
                        ...formData,
                        proposedStandard: cleanedValue === "" ? null : (numValue >= 0 ? numValue : null),
                      });
                    }}
                    placeholder="30,000"
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    제시 적용 단가 (천원)
                  </label>
                  <input
                    type="text"
                    value={numberInputValues.proposedApplied}
                    onChange={(e) => {
                      const formattedValue = formatNumberWithCommas(e.target.value);
                      setNumberInputValues({ ...numberInputValues, proposedApplied: formattedValue });
                      const numValue = parseNumberFromString(e.target.value);
                      const cleanedValue = e.target.value.replace(/,/g, "").trim();
                      setFormData({
                        ...formData,
                        proposedApplied: cleanedValue === "" ? null : (numValue >= 0 ? numValue : null),
                      });
                    }}
                    placeholder="11,500"
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    할인율 (%)
                  </label>
                  <div className="w-full rounded-[1.25rem] bg-muted/10 border border-border/10 py-4 px-5 text-sm font-black text-primary/60">
                    {formData.proposedStandard && (formData.proposedApplied !== null && formData.proposedApplied !== undefined)
                      ? (() => {
                        const discountRate = calculateDiscountRate(formData.proposedStandard, formData.proposedApplied);
                        return discountRate !== null ? `${discountRate.toFixed(2)}%` : "-";
                      })()
                      : "-"}
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    내부 단가 (천원)
                  </label>
                  <input
                    type="text"
                    value={numberInputValues.internalApplied}
                    onChange={(e) => {
                      const formattedValue = formatNumberWithCommas(e.target.value);
                      setNumberInputValues({ ...numberInputValues, internalApplied: formattedValue });
                      const numValue = parseNumberFromString(e.target.value);
                      const cleanedValue = e.target.value.replace(/,/g, "").trim();
                      setFormData({
                        ...formData,
                        internalApplied: cleanedValue === "" ? null : (numValue >= 0 ? numValue : null),
                      });
                    }}
                    placeholder="14,516"
                    className="w-full rounded-[1.25rem] bg-yellow-50/50 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    인상률 (%)
                  </label>
                  <div className="w-full rounded-[1.25rem] bg-muted/10 border border-border/10 py-4 px-5 text-sm font-black text-muted-foreground/60">
                    {formData.year && formData.internalApplied
                      ? (() => {
                        const previousYear = formData.year - 1;
                        const previousYearPrice = unitPrices.find(
                          (p) =>
                            p.affiliationGroup === formData.affiliationGroup &&
                            p.jobGroup === formData.jobGroup &&
                            p.jobLevel === formData.jobLevel &&
                            p.grade === formData.grade &&
                            p.year === previousYear
                        );
                        if (previousYearPrice && previousYearPrice.internalApplied) {
                          const increaseRate = ((formData.internalApplied - previousYearPrice.internalApplied) / previousYearPrice.internalApplied) * 100;
                          return `${increaseRate.toFixed(2)}%`;
                        }
                        return "-";
                      })()
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-10 mt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-2xl border border-border/40 bg-white px-8 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-10 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기준단가표 목록 - Neo Modern Table */}
      <div className="overflow-x-auto custom-scrollbar-main border border-border/20 rounded-2xl mx-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/40">
              <th className="px-5 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                소속
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                직군
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                직급
              </th>
              <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                등급
              </th>
              <th className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                연도
              </th>
              <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                제시 표준
              </th>
              <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                제시 적용
              </th>
              <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                할인율
              </th>
              <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 bg-primary/5">
                내부 적용
              </th>
              <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                인상률
              </th>
              <th className="relative px-6 py-5">
                <span className="sr-only">작업</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPrices.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-gray-500">
                  기준단가 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              (() => {
                const averages = calculateGroupAverages(filteredPrices, unitPrices);
                const groupedPrices = new Map<string, UnitPrice[]>();

                filteredPrices.forEach((price) => {
                  const key = price.affiliationGroup;
                  if (!groupedPrices.has(key)) {
                    groupedPrices.set(key, []);
                  }
                  groupedPrices.get(key)!.push(price);
                });

                const rows: React.ReactElement[] = [];

                const sections = [
                  { name: "당사", groups: ["위엠비_컨설팅", "위엠비_개발"] },
                  { name: "타사", groups: ["외주_컨설팅", "외주_개발"] },
                ];

                sections.forEach((section) => {
                  const sectionPrices: UnitPrice[] = [];
                  let hasGroups = false;

                  section.groups.forEach((affiliationGroup) => {
                    const groupPrices = groupedPrices.get(affiliationGroup) || [];
                    if (groupPrices.length === 0) return;
                    hasGroups = true;
                    sectionPrices.push(...groupPrices);

                    groupPrices.forEach((price) => {
                      const previousYear = price.year - 1;
                      const previousYearPrice = unitPrices.find(
                        (p) =>
                          p.affiliationGroup === price.affiliationGroup &&
                          p.jobGroup === price.jobGroup &&
                          p.jobLevel === price.jobLevel &&
                          p.grade === price.grade &&
                          p.year === previousYear
                      );

                      const increaseRate = previousYearPrice && previousYearPrice.internalApplied && price.internalApplied
                        ? ((price.internalApplied - previousYearPrice.internalApplied) / previousYearPrice.internalApplied) * 100
                        : null;

                      const discountRate = calculateDiscountRate(price.proposedStandard, price.proposedApplied);

                      rows.push(
                        <tr key={price.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-foreground/80">
                            {price.affiliationGroup}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-foreground/80">
                            {price.jobGroup}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-foreground/80">
                            {price.jobLevel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-foreground/80">
                            <span className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-black uppercase tracking-tighter">
                              {price.grade}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-muted-foreground/60">
                            {price.year}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-mono font-bold text-foreground/70">
                            {price.proposedStandard !== null ? price.proposedStandard.toLocaleString() : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-mono font-bold text-foreground/70">
                            {price.proposedApplied !== null ? price.proposedApplied.toLocaleString() : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold text-muted-foreground">
                            {discountRate !== null ? `${discountRate.toFixed(2)}%` : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-mono font-black text-primary bg-primary/[0.03]">
                            {price.internalApplied !== null ? price.internalApplied.toLocaleString() : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold">
                            {increaseRate !== null ? (
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${increaseRate >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {increaseRate >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                {increaseRate.toFixed(2)}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(price)}
                                className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(price.id)}
                                className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    const groupAverage = averages.find(a => a.affiliationGroup === affiliationGroup);
                    if (groupAverage) {
                      rows.push(
                        <tr key={`sum-${affiliationGroup}`} className="bg-gray-50 font-semibold border-y border-gray-100">
                          <td colSpan={5} className="px-4 py-3 text-sm text-gray-900 text-center bg-gray-50">
                            {affiliationGroup} 소계
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                            -
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                            {groupAverage.averageProposedApplied !== null
                              ? groupAverage.averageProposedApplied.toLocaleString()
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                            {groupAverage.averageDiscountRate !== null
                              ? `${groupAverage.averageDiscountRate.toFixed(2)}%`
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 font-bold bg-yellow-100">
                            {groupAverage.averageInternalApplied !== null
                              ? groupAverage.averageInternalApplied.toLocaleString()
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                            {groupAverage.averageIncreaseRate !== null ? (
                              <span className={`inline-flex items-center gap-1 ${groupAverage.averageIncreaseRate >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {groupAverage.averageIncreaseRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {groupAverage.averageIncreaseRate.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-900">
                            -
                          </td>
                        </tr>
                      );
                    }
                  });

                  if (hasGroups && sectionPrices.length > 0) {
                    const sectionAverages = calculateGroupAverages(sectionPrices, unitPrices)[0];
                    if (sectionAverages) {
                      rows.push(
                        <tr key={`section-sum-${section.name}`} className="bg-muted/30 border-t-2 border-border/20">
                          <td colSpan={5} className="px-5 py-4 text-xs font-bold text-slate-800 text-center">
                            {section.name} 평균
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs text-muted-foreground/40 font-mono">
                            -
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-black text-foreground/80 font-mono">
                            {sectionAverages.averageProposedApplied !== null
                              ? sectionAverages.averageProposedApplied.toLocaleString()
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-black text-foreground/80">
                            {sectionAverages.averageDiscountRate !== null
                              ? `${sectionAverages.averageDiscountRate.toFixed(2)}%`
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-black text-primary bg-primary/10 font-mono">
                            {sectionAverages.averageInternalApplied !== null
                              ? sectionAverages.averageInternalApplied.toLocaleString()
                              : "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-black">
                            {sectionAverages.averageIncreaseRate !== null ? (
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sectionAverages.averageIncreaseRate >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {sectionAverages.averageIncreaseRate >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                {sectionAverages.averageIncreaseRate.toFixed(2)}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4"></td>
                        </tr>
                      );
                    }
                  }
                });

                return rows;
              })()
            )}
          </tbody>
        </table>
      </div>
      {/* 연도 복사 모달 - Neo Integrated */}
      {copyYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setCopyYearModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] border border-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="border-b border-border/40 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <Copy className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">연도 데이터 복제</h2>
                </div>
              </div>
              <button onClick={() => setCopyYearModal(false)} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  원본 연도 <span className="text-primary">*</span>
                </label>
                <select
                  value={copySourceYear}
                  onChange={(e) => setCopySourceYear(e.target.value)}
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                >
                  <option value="">원본 연도 선택</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  대상 연도 <span className="text-primary">*</span>
                </label>
                <select
                  value={copyTargetYear}
                  onChange={(e) => setCopyTargetYear(e.target.value)}
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                >
                  <option value="">대상 연도 선택</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>{year}년{year === currentYear + 1 ? ' (내년)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-bold text-primary/70 leading-relaxed">
                  주의: 대상 연도에 이미 데이터가 존재하는 경우, 현재 작업으로 인해 정보가 영구적으로 덮어씌워질 수 있습니다.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setCopyYearModal(false)}
                  className="rounded-2xl border border-border/40 bg-white px-8 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  onClick={handleCopyYear}
                  disabled={isCopying}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
                >
                  <Copy className="h-4 w-4" />
                  {isCopying ? "복사 중..." : "데이터 복사 실행"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
);

UnitPriceLaborTab.displayName = "UnitPriceLaborTab";
