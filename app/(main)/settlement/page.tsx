"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
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
    router.push(`/settlement/new?projectId=${selectedProjectId}`);
  };

  const availableProjects = projects.filter(
    (project) => !settlements.some((s) => s.project_id === project.id)
  );

  const projectOptions = availableProjects.map((p) => ({
    value: p.id,
    label: `${p.name} ${p.project_code ? `(${p.project_code})` : ""}`,
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
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">수지정산서 현황</h1>
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
            수지정산서
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
              <TableHead align="center">계획 매출</TableHead>
              <TableHead align="center">실행 매출</TableHead>
              <TableHead align="center">계획 이익</TableHead>
              <TableHead align="center">실행 이익</TableHead>
              <TableHead align="center">이익 증감</TableHead>
              <TableHead align="center">상태</TableHead>
              <TableHead align="right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    <p className="text-sm text-gray-500">데이터를 불러오고 있습니다...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedSettlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FolderOpen className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">조회된 수지정산서가 없습니다</p>
                      <p className="text-sm text-gray-500">프로젝트를 선택하여 수지정산서를 작성하세요</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedSettlements.map((s) => {
                const actualProfit = s.actual_revenue - s.actual_cost;

                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/settlement/${s.id}`)}
                  >
                    <TableCell align="center">
                      <span className="text-sm text-gray-500">{s.project_code || "-"}</span>
                    </TableCell>
                    <TableCell align="left">
                      <span className="font-medium text-gray-900">{s.project_name}</span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm text-gray-900">{s.customer_name || "-"}</span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-medium text-gray-900">
                        {s.planned_revenue ? formatCurrency(s.planned_revenue * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-medium text-gray-900">
                        {s.actual_revenue ? formatCurrency(s.actual_revenue * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-medium text-gray-900">
                        {s.planned_profit ? formatCurrency(s.planned_profit * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-medium text-gray-900">
                        {s.actual_cost ? formatCurrency((s.actual_revenue - s.actual_cost) * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className={cn(
                        "text-sm font-medium",
                        (s.profit_diff || 0) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {s.profit_diff ? formatCurrency(s.profit_diff * 1000, "KRW") : "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={getStatusVariant(s.status)}>
                        {getStatusLabel(s.status)}
                      </Badge>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/settlement/${s.id}`);
                          }}
                        >
                          상세
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s.id);
                          }}
                          disabled={deletingId === s.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
