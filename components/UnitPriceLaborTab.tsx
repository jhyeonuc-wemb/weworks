"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  Copy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FolderOpen,
  Edit,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  SearchInput,
  Dropdown,
  DraggablePanel,
} from "@/components/ui";
import { cn } from "@/lib/utils";

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
  handleAdd: (rect?: DOMRect) => void;
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const [formData, setFormData] = useState<Partial<UnitPrice>>({
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
    handleAdd: (rect?: DOMRect) => handleAdd(rect)
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

  const paginatedPrices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPrices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPrices, currentPage]);

  const totalPages = Math.ceil(filteredPrices.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterYear, filterAffiliation]);

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
      proposedStandardAverage: number;
      proposedAppliedAverage: number;
      averageDiscountRate: number | null;
      internalAppliedAverage: number;
      averageIncreaseRate: number | null;
    }> = [];

    groups.forEach((groupPrices, affiliationGroup) => {
      const validProposedStandard = groupPrices.filter((p) => p.proposedStandard !== null && p.proposedStandard !== undefined);
      const proposedStandardAverage = validProposedStandard.length > 0
        ? Math.round(validProposedStandard.reduce((acc, p) => acc + (p.proposedStandard || 0), 0) / validProposedStandard.length)
        : 0;

      const validProposedApplied = groupPrices.filter((p) => p.proposedApplied !== null && p.proposedApplied !== undefined);
      const proposedAppliedAverage = validProposedApplied.length > 0
        ? Math.round(validProposedApplied.reduce((acc, p) => acc + (p.proposedApplied || 0), 0) / validProposedApplied.length)
        : 0;

      const validDiscountRates = groupPrices
        .map((p) => calculateDiscountRate(p.proposedStandard, p.proposedApplied))
        .filter((rate) => rate !== null) as number[];
      const avgDiscountRate = validDiscountRates.length > 0
        ? validDiscountRates.reduce((acc, rate) => acc + rate, 0) / validDiscountRates.length
        : null;

      const validInternalApplied = groupPrices.filter((p) => p.internalApplied !== null && p.internalApplied !== undefined);
      const internalAppliedAverage = validInternalApplied.length > 0
        ? Math.round(validInternalApplied.reduce((acc, p) => acc + (p.internalApplied || 0), 0) / validInternalApplied.length)
        : 0;

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
        proposedStandardAverage,
        proposedAppliedAverage,
        averageDiscountRate: avgDiscountRate,
        internalAppliedAverage,
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

  const handleAdd = (rect?: DOMRect) => {
    if (rect) setTriggerRect(rect);
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

  const handleEdit = (price: UnitPrice, e: React.MouseEvent) => {
    setTriggerRect(e.currentTarget.getBoundingClientRect());
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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 필터 및 검색 - Standard Style */}
      <div className="flex items-center gap-x-4 mx-1">
        <SearchInput
          placeholder="소속, 직군, 직급, 등급으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-3 shrink-0">
          <Dropdown
            value={filterYear}
            onChange={(val) => setFilterYear(val as string)}
            options={[
              { value: "", label: "전체 연도" },
              ...(availableYears.length > 0
                ? availableYears.map((year) => ({ value: year.toString(), label: `${year}년` }))
                : YEARS.map((year) => ({ value: year.toString(), label: `${year}년` })))
            ]}
            className="w-40"
          />
          <Dropdown
            value={filterAffiliation}
            onChange={(val) => setFilterAffiliation(val as string)}
            options={[
              { value: "", label: "전체 소속" },
              ...AFFILIATION_GROUPS.map((group) => ({ value: group, label: group }))
            ]}
            className="w-44"
          />
          <Button
            onClick={(e) => {
              setTriggerRect(e.currentTarget.getBoundingClientRect());
              setCopyYearModal(true);
            }}
            variant="primary"
            className="h-11 px-6"
          >
            <Copy className="h-4 w-4 mr-2" />
            연도 복사
          </Button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">소속</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">직군</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">직급</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">등급</TableHead>
                <TableHead className="px-8 py-3 text-center text-sm text-slate-900">연도</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">제시 표준</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">제시 적용</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">할인율</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm font-black text-primary bg-primary/5">내부 적용</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">인상률</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {filteredPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="px-8 py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-medium text-foreground">기준단가 데이터가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (() => {
                  const averages = calculateGroupAverages(paginatedPrices, unitPrices);
                  const groupedPrices = new Map<string, UnitPrice[]>();

                  paginatedPrices.forEach((price) => {
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
                          <TableRow key={price.id} className="hover:bg-primary/[0.02] transition-colors group">
                            <TableCell className="whitespace-nowrap px-8 py-3 text-sm text-slate-900">
                              {price.affiliationGroup}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-sm text-slate-900">
                              {price.jobGroup}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-sm text-slate-900">
                              {price.jobLevel}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-sm text-slate-900">
                              <span className="px-2 py-0.5 rounded-md bg-muted/50 text-xs">
                                {price.grade}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-center text-sm text-slate-600">
                              {price.year}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm font-mono text-slate-700">
                              {price.proposedStandard !== null ? price.proposedStandard.toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm font-mono text-slate-700">
                              {price.proposedApplied !== null ? price.proposedApplied.toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-500">
                              {discountRate !== null ? `${discountRate.toFixed(2)}%` : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm font-mono text-primary bg-primary/[0.03]">
                              {price.internalApplied !== null ? price.internalApplied.toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm">
                              {increaseRate !== null ? (
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${increaseRate >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {increaseRate >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                  {increaseRate.toFixed(2)}%
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-8 py-3 text-right">
                              <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleEdit(price, e)}
                                  className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(price.id)}
                                  className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });

                      const groupAverage = averages.find(a => a.affiliationGroup === affiliationGroup);
                      groupAverage && rows.push(
                        <TableRow key={`sum-${affiliationGroup}`} className="bg-muted/30 border-y border-border/10">
                          <TableCell colSpan={5} className="px-8 py-3 text-sm text-slate-900 text-center">
                            {affiliationGroup} 소계
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-700">
                            {groupAverage.proposedStandardAverage > 0 ? groupAverage.proposedStandardAverage.toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-700">
                            {groupAverage.proposedAppliedAverage > 0
                              ? groupAverage.proposedAppliedAverage.toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-500">
                            {groupAverage.averageDiscountRate !== null
                              ? `${groupAverage.averageDiscountRate.toFixed(2)}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-primary bg-primary/5">
                            {groupAverage.internalAppliedAverage > 0
                              ? groupAverage.internalAppliedAverage.toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-foreground">
                            {groupAverage.averageIncreaseRate !== null ? (
                              <span className={`inline-flex items-center gap-1 ${groupAverage.averageIncreaseRate >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {groupAverage.averageIncreaseRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {groupAverage.averageIncreaseRate.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-center text-sm text-foreground">
                            -
                          </TableCell>
                        </TableRow>
                      );
                    });

                    if (hasGroups && sectionPrices.length > 0) {
                      const sectionAverages = calculateGroupAverages(sectionPrices, unitPrices)[0];
                      sectionAverages && rows.push(
                        <TableRow key={`section-sum-${section.name}`} className="bg-muted/30 border-t-2 border-border/20">
                          <TableCell colSpan={5} className="px-8 py-3 text-sm text-slate-800 text-center">
                            {section.name} 평균
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-500 font-mono">
                            {sectionAverages.proposedStandardAverage > 0 ? sectionAverages.proposedStandardAverage.toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-700 font-mono">
                            {sectionAverages.proposedAppliedAverage > 0
                              ? sectionAverages.proposedAppliedAverage.toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-slate-700">
                            {sectionAverages.averageDiscountRate !== null
                              ? `${sectionAverages.averageDiscountRate.toFixed(2)}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-3 text-right text-sm text-primary bg-primary/10 font-mono">
                            {sectionAverages.internalAppliedAverage > 0
                              ? sectionAverages.internalAppliedAverage.toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-8 py-5 text-right text-sm">
                            {sectionAverages.averageIncreaseRate !== null ? (
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sectionAverages.averageIncreaseRate >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {sectionAverages.averageIncreaseRate >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                {sectionAverages.averageIncreaseRate.toFixed(2)}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-8 py-5"></TableCell>
                        </TableRow>
                      );
                    }
                  });

                  return rows;
                })()
              )}
            </TableBody>
          </Table>
        </div>

        {/* 푸터 - 페이지네이션 및 요약 */}
        <div className="bg-muted/30 px-8 py-5 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500">TOTAL : <span className="text-primary ml-1">{filteredPrices.length}</span></div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-normal"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs transition-all",
                      currentPage === page
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-white hover:text-foreground"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 등록/수정 패널 */}
      <DraggablePanel
        open={isAdding || editingId !== null}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        triggerRect={triggerRect}
        title={isAdding ? "신규 인력 단가 등록" : "인력 단가 속성 수정"}
        description="기관별, 직군별 기준 인력 단가를 설정하고 관리합니다."
        className="max-w-3xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                소속 그룹 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={formData.affiliationGroup || ""}
                onChange={(val) => setFormData({ ...formData, affiliationGroup: val as string })}
                options={AFFILIATION_GROUPS.map(group => ({ value: group, label: group }))}
                placeholder="소속 선택"
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                직군 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={formData.jobGroup || ""}
                onChange={(val) => setFormData({ ...formData, jobGroup: val as string })}
                options={JOB_GROUPS.map(group => ({ value: group, label: group }))}
                placeholder="직군 선택"
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                직급 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={formData.jobLevel || ""}
                onChange={(val) => setFormData({ ...formData, jobLevel: val as string })}
                options={JOB_LEVELS.map(level => ({ value: level, label: level }))}
                placeholder="직급 선택"
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                등급 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={formData.grade || ""}
                onChange={(val) => setFormData({ ...formData, grade: val as string })}
                options={GRADES.map(grade => ({ value: grade, label: grade }))}
                placeholder="등급 선택"
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                기준 연도 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={formData.year || currentYear}
                onChange={(val) => setFormData({ ...formData, year: Number(val) })}
                options={YEARS.map(year => ({ value: year, label: `${year}년` }))}
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                할인율 (%)
              </label>
              <div className="w-full rounded-md bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-bold text-primary/60">
                {formData.proposedStandard && (formData.proposedApplied !== null && formData.proposedApplied !== undefined)
                  ? (() => {
                    const discountRate = calculateDiscountRate(formData.proposedStandard, formData.proposedApplied);
                    return discountRate !== null ? `${discountRate.toFixed(2)}%` : "-";
                  })()
                  : "-"}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                내부 적용 단가 (천원)
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                인상률 (%)
              </label>
              <div className="w-full rounded-md bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-bold text-muted-foreground/60">
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

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={handleCancel}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving} className="px-8 min-w-[120px]">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "저장 중..." : (editingId !== null ? "변경사항 저장" : "인력단가 등록")}
            </Button>
          </div>
        </div>
      </DraggablePanel>

      {/* 연도 복사 패널 */}
      <DraggablePanel
        open={copyYearModal}
        onOpenChange={setCopyYearModal}
        triggerRect={triggerRect}
        title="연도 데이터 복제"
        description="기준 연도의 모든 데이터를 다른 연도로 대량 복사합니다."
        className="max-w-xl"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                원본 연도 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={copySourceYear}
                onChange={(val) => setCopySourceYear(val as string)}
                options={availableYears.map(year => ({ value: year, label: `${year}년` }))}
                placeholder="원본 연도 선택"
                variant="standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                대상 연도 <span className="text-primary">*</span>
              </label>
              <Dropdown
                value={copyTargetYear}
                onChange={(val) => setCopyTargetYear(val as string)}
                options={YEARS.map(year => ({ value: year, label: `${year}년${year === currentYear + 1 ? ' (내년)' : ''}` }))}
                placeholder="대상 연도 선택"
                variant="standard"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <p className="text-xs font-bold text-orange-700 leading-relaxed">
              ⚠️ 주의: 대상 연도에 이미 데이터가 존재하는 경우, 현재 데이터가 덮어씌워질 수 있습니다. 복사 작업을 실행하시겠습니까?
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setCopyYearModal(false)}>
              취소
            </Button>
            <Button
              onClick={handleCopyYear}
              disabled={isCopying}
              className="px-8 min-w-[120px]"
            >
              <Copy className="h-4 w-4 mr-2" />
              {isCopying ? "복사 중..." : "데이터 복사 실행"}
            </Button>
          </div>
        </div>
      </DraggablePanel>
    </div>
  );
});

UnitPriceLaborTab.displayName = "UnitPriceLaborTab";
