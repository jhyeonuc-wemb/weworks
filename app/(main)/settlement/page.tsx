"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, ChevronLeft, ChevronRight, LineChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from "@/components/ui";

interface Settlement {
  id: number;
  project_id: number;
  projectCode: string | null;
  project_name: string | null;
  customerName: string | null;
  settlement_date: string;
  planned_revenue: number;
  planned_profit: number;
  planned_profit_rate: number;
  planned_svc_mm_own: number;
  planned_svc_mm_ext: number;
  actual_revenue: number;
  actual_cost: number;
  // (3) 수주차 실적 프로젝트영업이익 (API에서 계산)
  actual_profit: number;
  revenue_diff: number;
  // (1) 정산결과: 기준 계획대비 영업이익 증감액 (API에서 계산)
  profit_diff: number;
  actual_svc_mm_own: number;
  actual_svc_mm_ext: number;
  version: number;
  status: string;
  approved_date: string | null;
  created_at: string;
}

interface Project {
  id: number;
  projectCode: string | null;
  name: string;
  customerName: string | null;
}

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "plan_revenue_high", label: "계획 매출 높은 순" },
  { value: "plan_revenue_low", label: "계획 매출 낮은 순" },
  { value: "actual_revenue_high", label: "실행 매출 높은 순" },
  { value: "actual_revenue_low", label: "실행 매출 낮은 순" },
  { value: "diff_amount_high", label: "이익 증감액 높은 순" },
  { value: "diff_amount_low", label: "이익 증감액 낮은 순" },
];

export default function SettlementListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchYear, setSearchYear] = useState("전체");
  const [searchStatus, setSearchStatus] = useState("전체");
  const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([{ value: "전체", label: "상태" }]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profitabilities, setProfitabilities] = useState<{ project_id: number; status: string }[]>([]);
  const [lastProfitabilityStatus, setLastProfitabilityStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("project_code_desc");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [settlementRes, projectRes, profitabilityRes, phaseStatusRes] = await Promise.all([
        fetch("/api/settlement"),
        fetch("/api/projects"),
        fetch("/api/profitability?latestOnly=true"),
        fetch("/api/settings/phase-statuses?phaseCode=profitability"),
      ]);

      if (settlementRes.ok) {
        const data = await settlementRes.json();
        setSettlements(data.settlements || []);
      }
      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjects(data.projects || []);
      }
      if (profitabilityRes.ok) {
        const data = await profitabilityRes.json();
        setProfitabilities(data.profitabilities || []);
      }
      if (phaseStatusRes.ok) {
        const data = await phaseStatusRes.json();
        // display_order ASC 순 → 마지막 항목이 최종 상태
        const statuses: { code: string; display_order: number }[] = data.statuses || [];
        if (statuses.length > 0) {
          const last = statuses[statuses.length - 1];
          setLastProfitabilityStatus(last.code);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSettlements = useMemo(() => {
    let filtered = settlements;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (settlement) =>
          settlement.project_name?.toLowerCase().includes(query) ||
          settlement.projectCode?.toLowerCase().includes(query) ||
          settlement.customerName?.toLowerCase().includes(query)
      );
    }

    if (searchYear !== "전체") {
      filtered = filtered.filter(settlement => {
        if (!settlement.projectCode) return false;
        const match = settlement.projectCode.match(/^P(\d{2})-/);
        if (match) {
          const year = `20${match[1]}`;
          return year === searchYear;
        }
        return false;
      });
    }

    if (searchStatus !== "전체") {
      filtered = filtered.filter(settlement => settlement.status === searchStatus);
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "plan_revenue_high":
          return (b.planned_revenue || 0) - (a.planned_revenue || 0);
        case "plan_revenue_low":
          return (a.planned_revenue || 0) - (b.planned_revenue || 0);
        case "actual_revenue_high":
          return (b.actual_revenue || 0) - (a.actual_revenue || 0);
        case "actual_revenue_low":
          return (a.actual_revenue || 0) - (b.actual_revenue || 0);
        case "diff_amount_high":
          return (b.profit_diff || 0) - (a.profit_diff || 0);
        case "diff_amount_low":
          return (a.profit_diff || 0) - (b.profit_diff || 0);
        case "project_code_desc":
        default:
          if (!a.projectCode) return 1;
          if (!b.projectCode) return -1;
          return b.projectCode.localeCompare(a.projectCode);
      }
    });
  }, [settlements, sortOption, searchQuery, searchYear, searchStatus]);

  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSettlements.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSettlements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSettlements.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchYear, searchStatus, sortOption, itemsPerPage]);

  const startYears = useMemo(() => {
    const years = new Set<string>();
    settlements.forEach(s => {
      if (s.projectCode) {
        const match = s.projectCode.match(/^P(\d{2})-/);
        if (match) {
          years.add(`20${match[1]}`);
        }
      }
    });
    return ["전체", ...Array.from(years).sort().reverse()];
  }, [settlements]);

  const yearOptions = startYears.map(year => ({ value: year, label: year === "전체" ? "년도" : `${year}년` }));

  useEffect(() => {
    fetch(`/api/settings/phase-statuses?phaseCode=settlement`)
      .then(res => res.json())
      .then(data => {
        if (data.statuses && data.statuses.length > 0) {
          const opts = data.statuses.map((s: any) => ({ value: s.code, label: s.name }));
          setStatusOptions([{ value: "전체", label: "상태" }, ...opts]);
        }
      })
      .catch(console.error);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/settlement/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSettlements(settlements.filter((s) => s.id !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNew = () => {
    if (!selectedProjectId) {
      alert("프로젝트를 선택해주세요.");
      return;
    }
    router.push(`/projects/${selectedProjectId}/settlement`);
  };

  // 프로젝트 코드가 있고, 수지분석서가 최종 상태(단계 설정의 마지막 상태)인 프로젝트만 표시
  const availableProjects = projects.filter((project) => {
    if (!project.projectCode) return false;
    const hasCompletedProfitability = lastProfitabilityStatus
      ? profitabilities.some(
        (prof) => prof.project_id === project.id && prof.status === lastProfitabilityStatus
      )
      : false;
    const hasSettlement = settlements.some((s) => s.project_id === project.id);
    return hasCompletedProfitability && !hasSettlement;
  });

  const projectOptions = availableProjects
    .slice()
    .sort((a, b) => {
      const codeA = a.projectCode || "";
      const codeB = b.projectCode || "";
      return codeB.localeCompare(codeA);
    })
    .map((p) => ({
      value: p.id,
      label: `${p.projectCode || "N/A"}_${p.name}`,
    }));



  return (
    <div className="space-y-8 max-w-[1920px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">수지정산서 현황</h1>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            value={selectedProjectId || ""}
            onChange={(value) => setSelectedProjectId(value as number)}
            options={projectOptions}
            placeholder="프로젝트 선택"
            className="w-64"
            align="center"
            listAlign="left"
            listClassName="min-w-[400px]"
          />
          <Button
            variant="primary"
            onClick={handleCreateNew}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            수지정산서
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-wrap items-center gap-4 mx-1">
        <div className="w-64">
          <SearchInput
            placeholder="프로젝트, 코드, 고객사 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dropdown
          value={searchYear}
          onChange={(value) => setSearchYear(value as string)}
          options={yearOptions}
          className="w-36"
          align="center"
        />
        <Dropdown
          value={searchStatus}
          onChange={(value) => setSearchStatus(value as string)}
          options={statusOptions}
          className="w-36"
          align="center"
        />
        <div className="ml-auto">
          <Dropdown
            value={sortOption}
            onChange={(value) => setSortOption(value as string)}
            options={sortOptions}
            className="w-56"
            align="center"
          />
        </div>
      </div>

      {/* 테이블 섹션 */}
      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">코드</TableHead>
                <TableHead className="px-4 py-3 text-sm text-slate-900 text-center">프로젝트명</TableHead>
                <TableHead className="w-[140px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">고객사</TableHead>
                <TableHead className="w-[110px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">계획 매출</TableHead>
                <TableHead className="w-[110px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">실행 매출</TableHead>
                <TableHead className="w-[110px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">계획 이익</TableHead>
                <TableHead className="w-[110px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">실행 이익</TableHead>
                <TableHead className="w-[110px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">이익 증감</TableHead>
                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedSettlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">조회된 정산 내역이 없습니다</p>
                        <p className="text-sm text-muted-foreground">프로젝트를 선택하여 수지 정산을 시작하세요</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSettlements.map((s) => {
                  // API에서 (3) 수주차 실적 프로젝트영업이익으로 계산된 값
                  const actualProfit = s.actual_profit ?? (s.actual_revenue - s.actual_cost);

                  return (
                    <TableRow
                      key={s.id}
                      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                      onClick={() => router.push(`/projects/${s.project_id}/settlement`)}
                    >
                      <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/80 font-mono">
                          {s.projectCode || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="left" className="px-4 py-3">
                        <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-2 leading-snug">
                          {s.project_name}
                        </div>
                      </TableCell>
                      <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/80">
                          {s.customerName || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/40 font-mono">
                          {formatCurrency(s.planned_revenue * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/80 font-mono">
                          {formatCurrency(s.actual_revenue * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/40 font-mono">
                          {formatCurrency(s.planned_profit * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground/80 font-mono">
                          {formatCurrency(actualProfit * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                        <span className={cn(
                          "text-sm font-mono",
                          s.profit_diff >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {s.profit_diff > 0 ? "+" : ""}{formatCurrency(s.profit_diff * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={s.status} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
          <div className="absolute left-8 flex items-center gap-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedSettlements.length}</span></div>

            <div className="flex items-center gap-2 border-l border-border/40 pl-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                }}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-primary transition-colors"
              >
                {[10, 20, 30, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
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
              className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
