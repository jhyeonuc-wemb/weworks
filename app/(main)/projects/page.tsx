"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";
import { ProjectModal } from "@/components/projects/ProjectModal";


// 날짜 포맷팅 함수
// 날짜 포맷팅 함수
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    let date: Date;
    if (dateString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d] = dateString.split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

interface Project {
  id: number;
  project_code: string | null;
  name: string;
  customer_name: string | null;
  orderer_name: string | null;
  status: string;
  current_phase: string | null;
  manager_name: string | null;
  sales_representative_name: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  expected_amount?: number;
  net_profit?: number;
  profit_rate?: number;
  category_name: string | null;
}

const defaultProjects: Project[] = [];

const phaseLabels: Record<string, string> = {
  sales: "영업/PS",
  md_estimation: "M/D 산정",
  vrb: "VRB",
  confirmation: "컨펌",
  team_allocation: "인력 배치",
  profitability: "수지분석서",
  in_progress: "프로젝트 진행",
  settlement: "수지정산서",
  warranty: "하자보증",
  completed: "프로젝트 종료",
};

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "profit_high", label: "예상손익 높은 순" },
  { value: "profit_low", label: "예상손익 낮은 순" },
  { value: "rate_high", label: "예상수익률 높은 순" },
  { value: "rate_low", label: "예상수익률 낮은 순" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("project_code_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 모달 상태관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const sortedProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = projects.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.project_code?.toLowerCase().includes(query) ||
        p.customer_name?.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "profit_high":
          return (b.net_profit || 0) - (a.net_profit || 0);
        case "profit_low":
          return (a.net_profit || 0) - (b.net_profit || 0);
        case "rate_high":
          return (b.profit_rate || 0) - (a.profit_rate || 0);
        case "rate_low":
          return (a.profit_rate || 0) - (b.profit_rate || 0);
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [projects, sortOption, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, itemsPerPage]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        setProjects(defaultProjects);
      }
    } catch (error) {
      setProjects(defaultProjects);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (data: any) => {
    const url = selectedProject ? `/api/projects/${selectedProject.id}` : "/api/projects";
    const method = selectedProject ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchProjects();
        setIsModalOpen(false); // Close modal on successful save
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const getPhaseVariant = (phase: string | null): "success" | "warning" | "info" | "default" => {
    if (!phase) return "default";
    if (["completed", "warranty", "settlement", "in_progress", "profitability"].includes(phase)) return "success";
    if (["vrb", "confirmation", "team_allocation"].includes(phase)) return "warning";
    if (["md_estimation", "sales"].includes(phase)) return "info";
    return "default";
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            프로젝트 현황
          </h1>
        </div>
        <Button
          variant="primary"
          onClick={(e) => {
            setSelectedProject(null);
            setTriggerRect(e.currentTarget.getBoundingClientRect());
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          프로젝트
        </Button>
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
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">프로젝트 코드</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">프로젝트명</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">분야</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">고객사</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">계약금액</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">계약기간</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">단계</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">PM</TableHead>
                <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">영업대표</TableHead>
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
              ) : sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">조회된 프로젝트가 없습니다</p>
                        <p className="text-sm text-muted-foreground">신규 프로젝트를 등록하여 관리를 시작하세요</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => {
                  const phase = project.current_phase || "sales";
                  const phaseLabel = phaseLabels[phase] || phase || "-";
                  const phaseVariant = getPhaseVariant(phase);

                  return (
                    <TableRow
                      key={project.id}
                      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80 font-mono">
                          {project.project_code || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="left" className="px-8 py-3">
                        <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80">
                          {project.category_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80">
                          {project.customer_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80 font-mono">
                          {project.expected_amount ? formatCurrency(project.expected_amount, "KRW") : "-"}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <div className="text-sm text-foreground/80 whitespace-nowrap">
                          {project.contract_start_date ? formatDate(project.contract_start_date) : "-"}
                          {" ~ "}
                          {project.contract_end_date ? formatDate(project.contract_end_date) : "-"}
                        </div>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <Badge variant={phaseVariant} className="rounded-xl px-3 py-1 text-[10px]">
                          {phaseLabel}
                        </Badge>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80">
                          {project.manager_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell align="center" className="px-8 py-3">
                        <span className="text-sm text-foreground/80">
                          {project.sales_representative_name || "-"}
                        </span>
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
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedProjects.length}</span></div>

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

      <ProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        project={selectedProject}
        onSave={handleSaveProject}
        triggerRect={triggerRect}
      />
    </div>
  );
}
