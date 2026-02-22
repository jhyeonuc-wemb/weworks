"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, ChevronLeft, ChevronRight, LineChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";

interface Settlement {
  id: number;
  project_id: number;
  project_code: string | null;
  project_name: string | null;
  customer_name: string | null;
  settlement_date: string;
  planned_revenue: number;
  planned_profit: number;
  planned_profit_rate: number;
  planned_svc_mm_own: number;
  planned_svc_mm_ext: number;
  actual_revenue: number;
  actual_cost: number;
  revenue_diff: number;
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
  project_code: string | null;
  name: string;
  customer_name: string | null;
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
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

      const settlementRes = await fetch("/api/settlement");
      if (settlementRes.ok) {
        const data = await settlementRes.json();
        setSettlements(data.settlements || []);
      }

      const projectRes = await fetch("/api/projects");
      if (projectRes.ok) {
        const data = await projectRes.json();
        setProjects(data.projects || []);
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
      filtered = settlements.filter(
        (settlement) =>
          settlement.project_name?.toLowerCase().includes(query) ||
          settlement.project_code?.toLowerCase().includes(query) ||
          settlement.customer_name?.toLowerCase().includes(query)
      );
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
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [settlements, sortOption, searchQuery]);

  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSettlements.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSettlements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSettlements.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, itemsPerPage]);

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

  const availableProjects = projects.filter(
    (project) => !settlements.some((s) => s.project_id === project.id)
  );

  const projectOptions = availableProjects.map((p) => ({
    value: p.id,
    label: `${p.project_code || "N/A"}_${p.name}`,
  }));

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    if (status === "approved") return "success";
    if (status === "pending") return "warning";
    if (status === "rejected") return "error";
    return "default";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: "초안",
      pending: "검토 중",
      approved: "승인",
      rejected: "반려",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8">
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
      <div className="flex items-center gap-x-4 mx-1">
        <SearchInput
          placeholder="프로젝트, 코드, 고객사 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Dropdown
          value={sortOption}
          onChange={(value) => setSortOption(value as string)}
          options={sortOptions}
          className="w-64"
          align="center"
        />
      </div>

      {/* 테이블 섹션 */}
      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">코드</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">프로젝트명</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">고객사</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">계획 매출</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">실행 매출</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">계획 이익</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">실행 이익</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">이익 증감</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">상태</TableHead>
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
                  const actualProfit = s.actual_revenue - s.actual_cost;

                  return (
                    <TableRow
                      key={s.id}
                      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                      onClick={() => router.push(`/projects/${s.project_id}/settlement`)}
                    >
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80 font-mono">
                          {s.project_code || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="left" className="px-8 py-3">
                        <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                          {s.project_name}
                        </div>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80">
                          {s.customer_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-8 py-3">
                        <span className="text-sm text-foreground/40 font-mono italic">
                          {formatCurrency(s.planned_revenue * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-8 py-3">
                        <span className="text-sm text-foreground/80 font-mono">
                          {formatCurrency(s.actual_revenue * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-8 py-3">
                        <span className="text-sm text-foreground/40 font-mono italic">
                          {formatCurrency(s.planned_profit * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="px-8 py-3">
                        <span className="text-sm text-foreground/80 font-mono">
                          {formatCurrency(actualProfit * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className={cn(
                          "text-xs font-bold font-mono px-2 py-1 rounded-md",
                          s.profit_diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {s.profit_diff > 0 ? "+" : ""}{formatCurrency(s.profit_diff * 1000, "KRW", false)}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <Badge variant={s.status === "COMPLETED" ? "success" : s.status === "IN_PROGRESS" ? "warning" : "info"} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none">
                          {s.status === "COMPLETED" ? "완료" : s.status === "IN_PROGRESS" ? "작성중" : "대기"}
                        </Badge>
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
