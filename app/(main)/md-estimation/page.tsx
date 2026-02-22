"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";

interface Project {
  id: number;
  project_code: string | null;
  name: string;
  customer_name: string | null;
}

interface MdEstimation {
  id: number;
  project_id: number;
  project_code: string | null;
  project_name: string;
  customer_name: string | null;
  project_difficulty?: number;
  version: number;
  total_mm: number;
  status: string;
  created_at: string;
}

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "mm_high", label: "총 M/M 많은 순" },
  { value: "mm_low", label: "총 M/M 적은 순" },
  { value: "difficulty_high", label: "가중치 높은 순" },
  { value: "difficulty_low", label: "가중치 낮은 순" },
];

export default function MdEstimationListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [estimations, setEstimations] = useState<MdEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("project_code_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, estimationsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/md-estimations"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (estimationsRes.ok) {
        const estimationsData = await estimationsRes.json();
        setEstimations(estimationsData.estimations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedEstimations = useMemo(() => {
    let filtered = estimations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = estimations.filter(
        (est) =>
          est.project_name?.toLowerCase().includes(query) ||
          est.project_code?.toLowerCase().includes(query) ||
          est.customer_name?.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "mm_high":
          return (b.total_mm || 0) - (a.total_mm || 0);
        case "mm_low":
          return (a.total_mm || 0) - (b.total_mm || 0);
        case "difficulty_high":
          return (b.project_difficulty || 0) - (a.project_difficulty || 0);
        case "difficulty_low":
          return (a.project_difficulty || 0) - (b.project_difficulty || 0);
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [estimations, sortOption, searchQuery]);

  const paginatedEstimations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEstimations.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEstimations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedEstimations.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/md-estimations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEstimations(estimations.filter((est) => est.id !== id));
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
    router.push(`/projects/${selectedProjectId}/md-estimation`);
  };

  const availableProjects = projects.filter(
    (project) => !estimations.some((est) => est.project_id === project.id)
  );

  const projectOptions = availableProjects.map((p) => ({
    value: p.id,
    label: `${p.project_code || "N/A"}_${p.name}`,
  }));

  const getStatusVariant = (status: string): "success" | "warning" | "info" | "default" => {
    if (status === "COMPLETED") return "success";
    if (status === "IN_PROGRESS") return "warning";
    return "info";
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">M/D 산정 현황</h1>
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
            M/D 산정
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
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">가중치</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">총 투입(M/M)</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedEstimations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">조회된 산정 내역이 없습니다</p>
                        <p className="text-sm text-muted-foreground">프로젝트를 선택하여 M/D 산정을 시작하세요</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEstimations.map((estimation) => (
                  <TableRow
                    key={estimation.id}
                    className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/projects/${estimation.project_id}/md-estimation`)}
                  >
                    <TableCell align="center" className="px-8 py-3">
                      <span className="text-sm text-foreground/80 font-mono">
                        {estimation.project_code || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="left" className="px-8 py-3">
                      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                        {estimation.project_name}
                      </div>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <span className="text-sm text-foreground/80">
                        {estimation.customer_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <span className="text-sm text-foreground/80 font-mono">
                        {estimation.project_difficulty ? Number(estimation.project_difficulty).toFixed(3) : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="px-8 py-3">
                      <span className="text-sm text-foreground/80 font-mono">
                        {estimation.total_mm ? Number(estimation.total_mm).toFixed(2) : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center" className="px-8 py-3">
                      <Badge variant={getStatusVariant(estimation.status)} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none">
                        {getStatusLabel(estimation.status)}
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
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedEstimations.length}</span></div>

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
