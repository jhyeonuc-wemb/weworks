"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";
import { ProjectModal } from "@/components/projects/ProjectModal";


// 날짜 포맷팅 함수
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    const dateStr = dateString.split('T')[0];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
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
};

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "profit_high", label: "예상손익 높은 순" },
  { value: "profit_low", label: "예상손익 낮은 순" },
  { value: "rate_high", label: "예상수익률 높은 순" },
  { value: "rate_low", label: "예상수익률 낮은 순" },
];

export default function ProjectsPage() {
  // const router = useRouter(); // Removed as per instruction
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("project_code_desc");

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
    if (["in_progress", "profitability", "settlement"].includes(phase)) return "success";
    if (["vrb", "confirmation"].includes(phase)) return "warning";
    if (["md_estimation", "sales"].includes(phase)) return "info";
    return "default";
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">프로젝트 현황</h1>
        </div>
        <Button
          variant="primary"
          onClick={(e) => {
            setSelectedProject(null);
            setTriggerRect(e.currentTarget.getBoundingClientRect());
            setIsModalOpen(true);
          }}
        >
          <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
          프로젝트
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex items-center gap-x-3">
        <SearchInput
          placeholder="프로젝트, 코드, 고객사 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Dropdown
          value={sortOption}
          onChange={(value) => setSortOption(value as string)}
          options={sortOptions}
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white shadow sm:rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="center">프로젝트 코드</TableHead>
              <TableHead align="left">프로젝트명</TableHead>
              <TableHead align="center">고객사</TableHead>
              <TableHead align="center">수주금액</TableHead>
              <TableHead align="center">기간</TableHead>
              <TableHead align="center">단계</TableHead>
              <TableHead align="center">PM</TableHead>
              <TableHead align="center">상태</TableHead>
              <TableHead align="right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    <p className="text-sm text-gray-500">데이터를 불러오고 있습니다...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FolderOpen className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">조회된 프로젝트가 없습니다</p>
                      <p className="text-sm text-gray-500">신규 프로젝트를 등록하여 관리를 시작하세요</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedProjects.map((project) => {
                const phase = project.current_phase || "sales";
                const phaseLabel = phaseLabels[phase] || phase || "-";

                return (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={(e) => {
                      setSelectedProject(project);
                      setTriggerRect(e.currentTarget.getBoundingClientRect());
                      setIsModalOpen(true);
                    }}
                  >
                    <TableCell align="center">
                      <span className="text-sm text-gray-500">{project.project_code || "-"}</span>
                    </TableCell>
                    <TableCell align="left">
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm text-gray-900">{project.customer_name || "-"}</span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-medium text-gray-900">
                        {project.expected_amount ? formatCurrency(project.expected_amount * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                        <span>{project.contract_start_date ? formatDate(project.contract_start_date) : "-"}</span>
                        <span>~ {project.contract_end_date ? formatDate(project.contract_end_date) : "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={getPhaseVariant(phase)}>
                        {phaseLabel}
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm text-gray-900">{project.manager_name || "-"}</span>
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={project.status === "active" ? "success" : "default"}>
                        {project.status === "active" ? "진행중" : "완료"}
                      </Badge>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setTriggerRect(e.currentTarget.getBoundingClientRect());
                          setIsModalOpen(true);
                        }}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
