"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
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
  version: number;
  total_mm: number;
  status: string;
  created_at: string;
}

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "mm_high", label: "총 M/M 많은 순" },
  { value: "mm_low", label: "총 M/M 적은 순" },
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
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [estimations, sortOption, searchQuery]);

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
    router.push(`/md-estimation/new?projectId=${selectedProjectId}`);
  };

  const availableProjects = projects.filter(
    (project) => !estimations.some((est) => est.project_id === project.id)
  );

  const projectOptions = availableProjects.map((p) => ({
    value: p.id,
    label: `${p.name} ${p.project_code ? `(${p.project_code})` : ""}`,
  }));

  const getStatusVariant = (status: string): "success" | "warning" | "info" | "default" => {
    if (status === "completed") return "success";
    if (status === "in_progress") return "warning";
    return "info";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: "초안",
      in_progress: "작성 중",
      completed: "완료",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">M/D 산정 현황</h1>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            value={selectedProjectId || ""}
            onChange={(value) => setSelectedProjectId(value as number)}
            options={projectOptions}
            placeholder="프로젝트 선택"
          />
          <Button
            variant="primary"
            onClick={handleCreateNew}
            disabled={!selectedProjectId}
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
            M/D 산정
          </Button>
        </div>
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
      <div className="bg-white shadow sm:rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="center">프로젝트 코드</TableHead>
              <TableHead align="left">프로젝트명</TableHead>
              <TableHead align="center">고객사</TableHead>
              <TableHead align="center">버전</TableHead>
              <TableHead align="center">총 M/M</TableHead>
              <TableHead align="center">상태</TableHead>
              <TableHead align="center">작성일</TableHead>
              <TableHead align="right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    <p className="text-sm text-gray-500">데이터를 불러오고 있습니다...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedEstimations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FolderOpen className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">조회된 M/D 산정이 없습니다</p>
                      <p className="text-sm text-gray-500">프로젝트를 선택하여 M/D 산정을 시작하세요</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedEstimations.map((estimation) => (
                <TableRow
                  key={estimation.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/md-estimation/${estimation.id}`)}
                >
                  <TableCell align="center">
                    <span className="text-sm text-gray-500">{estimation.project_code || "-"}</span>
                  </TableCell>
                  <TableCell align="left">
                    <span className="font-medium text-gray-900">{estimation.project_name}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-900">{estimation.customer_name || "-"}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-900">v{estimation.version}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm font-medium text-gray-900">
                      {estimation.total_mm ? `${estimation.total_mm.toFixed(1)} M/M` : "-"}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant={getStatusVariant(estimation.status)}>
                      {getStatusLabel(estimation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-500">
                      {new Date(estimation.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/md-estimation/${estimation.id}`);
                        }}
                      >
                        상세
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(estimation.id);
                        }}
                        disabled={deletingId === estimation.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
