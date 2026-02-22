"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, ChevronLeft, ChevronRight, FileText, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Popover, PopoverTrigger, PopoverContent } from "@/components/ui";

interface Project {
  id: number;
  project_code: string | null;
  name: string;
  customer_name: string | null;
}

interface VrbReview {
  id: number;
  project_id: number;
  project_code: string | null;
  project_name: string | null;
  version: number;
  status: string;
  created_at: string;
  customer_name?: string | null;
  best_estimated_revenue_services?: number | null;
  best_operating_profit?: number | null;
  best_operating_profit_percent?: number | null;
  review_result?: string | null;
}

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "revenue_high", label: "예상 매출 높은 순" },
  { value: "revenue_low", label: "예상 매출 낮은 순" },
  { value: "profit_high", label: "영업이익 높은 순" },
  { value: "profit_low", label: "영업이익 낮은 순" },
  { value: "rate_high", label: "이익률 높은 순" },
  { value: "rate_low", label: "이익률 낮은 순" },
];

const resultFilterOptions = [
  { value: "all", label: "심의결과 전체" },
  { value: "PROCEED", label: "진행" },
  { value: "STOP", label: "미진행" },
  { value: "NONE", label: "미지정" },
];

export default function VrbReviewListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<VrbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("project_code_desc");
  const [resultFilter, setResultFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isProfitHovered, setIsProfitHovered] = useState(false);
  const [isRateHovered, setIsRateHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseEnter = (type: 'profit' | 'rate') => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (type === 'profit') setIsProfitHovered(true);
    else setIsRateHovered(true);
  };

  const handleMouseLeave = (type: 'profit' | 'rate') => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (type === 'profit') setIsProfitHovered(false);
      else setIsRateHovered(false);
    }, 150); // 150ms buffer
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, reviewsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/vrb-reviews"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedReviews = useMemo(() => {
    let filtered = reviews;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.project_name?.toLowerCase().includes(query) ||
          review.project_code?.toLowerCase().includes(query) ||
          review.customer_name?.toLowerCase().includes(query)
      );
    }

    if (resultFilter !== "all") {
      filtered = filtered.filter((review) => {
        if (resultFilter === "NONE") return !review.review_result;
        return review.review_result === resultFilter;
      });
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "revenue_high":
          return (b.best_estimated_revenue_services || 0) - (a.best_estimated_revenue_services || 0);
        case "revenue_low":
          return (a.best_estimated_revenue_services || 0) - (b.best_estimated_revenue_services || 0);
        case "profit_high":
          return (b.best_operating_profit || 0) - (a.best_operating_profit || 0);
        case "profit_low":
          return (a.best_operating_profit || 0) - (b.best_operating_profit || 0);
        case "rate_high":
          return (b.best_operating_profit_percent || 0) - (a.best_operating_profit_percent || 0);
        case "rate_low":
          return (a.best_operating_profit_percent || 0) - (b.best_operating_profit_percent || 0);
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [reviews, sortOption, searchQuery, resultFilter]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedReviews, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, resultFilter, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/vrb-reviews/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReviews(reviews.filter((review) => review.id !== id));
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
    router.push(`/projects/${selectedProjectId}/vrb-review`);
  };

  const availableProjects = projects.filter(
    (project) => !reviews.some((review) => review.project_id === project.id)
  );

  const projectOptions = availableProjects.map((p) => ({
    value: p.id,
    label: `${p.project_code || "N/A"}_${p.name}`,
  }));

  const getStatusVariant = (status: string): "success" | "warning" | "info" | "default" => {
    if (status === "COMPLETED") return "success";
    if (status === "IN_PROGRESS") return "warning";
    if (status === "STANDBY") return "info";
    return "default";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      STANDBY: "대기",
      IN_PROGRESS: "작성 중",
      COMPLETED: "완료",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            VRB 현황
          </h1>
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
            VRB
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-x-4 mx-1">
        <Dropdown
          value={resultFilter}
          onChange={(value) => setResultFilter(value as string)}
          options={resultFilterOptions}
          className="w-48"
          align="left"
          placeholder="심의결과 필터"
        />
        <SearchInput
          placeholder="프로젝트, 코드, 고객사 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Dropdown
          value={sortOption}
          onChange={(value) => setSortOption(value as string)}
          options={sortOptions}
          className="w-48"
          align="center"
        />
      </div>

      {/* 테이블 섹션 */}
      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">프로젝트 코드</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">프로젝트명</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">심의 결과</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">고객사</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">예상 매출(원)</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">
                  <div className="flex items-center justify-center gap-1">
                    영업이익(원)
                    {isMounted && (
                      <Popover open={isProfitHovered}>
                        <PopoverTrigger asChild onMouseEnter={() => handleMouseEnter('profit')} onMouseLeave={() => handleMouseLeave('profit')}>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-primary transition-colors cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent side="top" align="center" className="w-64 p-3 bg-slate-900/95 text-white text-sm rounded-md shadow-2xl backdrop-blur-md border-none font-medium animate-in fade-in zoom-in-95 duration-200 pointer-events-none mb-1">
                          <div className="relative">
                            영업이익과 이익률은 Best Case(최선의 시나리오)를 기준으로 산출된 값입니다.
                            <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95" />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">
                  <div className="flex items-center justify-center gap-1">
                    이익률
                    {isMounted && (
                      <Popover open={isRateHovered}>
                        <PopoverTrigger asChild onMouseEnter={() => handleMouseEnter('rate')} onMouseLeave={() => handleMouseLeave('rate')}>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-primary transition-colors cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent side="top" align="center" className="w-64 p-3 bg-slate-900/95 text-white text-sm rounded-none shadow-2xl backdrop-blur-md border-none font-medium animate-in fade-in zoom-in-95 duration-200 pointer-events-none mb-1">
                          <div className="relative">
                            영업이익과 이익률은 Best Case(최선의 시나리오)를 기준으로 산출된 값입니다.
                            <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95" />
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableHead>

                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">조회된 VRB 내역이 없습니다</p>
                        <p className="text-sm text-muted-foreground">프로젝트를 선택하여 VRB 심의를 시작하세요</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/projects/${review.project_id}/vrb-review`)}
                  >
                    <TableCell align="center" className="px-8 py-3">
                      <span className="text-sm text-foreground/80 font-mono">
                        {review.project_code || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="left" className="px-8 py-3">
                      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                        {review.project_name}
                      </div>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <div className="flex items-center justify-center">
                        {review.review_result === "PROCEED" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 text-emerald-700 border border-emerald-200/50 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all group-hover:scale-105 group-hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)]">
                            <div className="relative flex h-5 w-5 items-center justify-center">
                              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                              <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-100">
                                <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={4} />
                              </div>
                            </div>
                            <span className="text-[11px] font-black tracking-tight leading-none">진행</span>
                          </div>
                        ) : review.review_result === "STOP" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 text-rose-700 border border-rose-200/50 shadow-[0_2px_10px_-4px_rgba(244,63,94,0.3)] backdrop-blur-sm transition-all group-hover:scale-105 group-hover:shadow-[0_4px_12px_-2px_rgba(244,63,94,0.4)]">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-rose-100">
                              <XCircle className="h-2.5 w-2.5" strokeWidth={4} />
                            </div>
                            <span className="text-[11px] font-black tracking-tight leading-none">미진행</span>
                          </div>
                        ) : (
                          <div className="w-8 h-[1px] bg-slate-200" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <span className="text-sm text-foreground/80">
                        {review.customer_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="px-8 py-3">
                      <span className="text-sm text-foreground/80 font-mono">
                        {review.best_estimated_revenue_services
                          ? formatCurrency(review.best_estimated_revenue_services, "KRW", false)
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="px-8 py-3">
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        (review.best_operating_profit || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {review.best_operating_profit
                          ? formatCurrency(review.best_operating_profit, "KRW", false)
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <span className={cn(
                        "text-sm font-bold font-mono",
                        (review.best_operating_profit_percent || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {review.best_operating_profit_percent
                          ? formatPercent(review.best_operating_profit_percent)
                          : "-"}
                      </span>
                    </TableCell>

                    <TableCell align="center" className="px-8 py-3">
                      <Badge variant={getStatusVariant(review.status)} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none">
                        {getStatusLabel(review.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
          <div className="absolute left-8 flex items-center gap-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedReviews.length}</span></div>

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
