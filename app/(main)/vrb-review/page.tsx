"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";

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
}

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "revenue_high", label: "예상 매출 높은 순" },
  { value: "revenue_low", label: "예상 매출 낮은 순" },
  { value: "profit_high", label: "영업이익 높은 순" },
  { value: "profit_low", label: "영업이익 낮은 순" },
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
      filtered = reviews.filter(
        (review) =>
          review.project_name?.toLowerCase().includes(query) ||
          review.project_code?.toLowerCase().includes(query) ||
          review.customer_name?.toLowerCase().includes(query)
      );
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
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [reviews, sortOption, searchQuery]);

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
    router.push(`/vrb-review/new?projectId=${selectedProjectId}`);
  };

  const availableProjects = projects.filter(
    (project) => !reviews.some((review) => review.project_id === project.id)
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
          <h1 className="text-2xl font-semibold text-gray-900">VRB 현황</h1>
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
            VRB
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
              <TableHead align="center">예상 매출</TableHead>
              <TableHead align="center">영업이익</TableHead>
              <TableHead align="center">이익률</TableHead>
              <TableHead align="center">상태</TableHead>
              <TableHead align="center">작성일</TableHead>
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
            ) : sortedReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FolderOpen className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">조회된 VRB가 없습니다</p>
                      <p className="text-sm text-gray-500">프로젝트를 선택하여 VRB를 시작하세요</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedReviews.map((review) => (
                <TableRow
                  key={review.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/vrb-review/${review.id}`)}
                >
                  <TableCell align="center">
                    <span className="text-sm text-gray-500">{review.project_code || "-"}</span>
                  </TableCell>
                  <TableCell align="left">
                    <span className="font-medium text-gray-900">{review.project_name}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-900">{review.customer_name || "-"}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-900">v{review.version}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm font-medium text-gray-900">
                      {review.best_estimated_revenue_services
                        ? formatCurrency(review.best_estimated_revenue_services * 1000, "KRW")
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm font-medium text-gray-900">
                      {review.best_operating_profit
                        ? formatCurrency(review.best_operating_profit * 1000, "KRW")
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <span className={cn(
                      "text-sm font-medium",
                      (review.best_operating_profit_percent || 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {review.best_operating_profit_percent
                        ? formatPercent(review.best_operating_profit_percent)
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant={getStatusVariant(review.status)}>
                      {getStatusLabel(review.status)}
                    </Badge>
                  </TableCell>
                  <TableCell align="center">
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/vrb-review/${review.id}`);
                        }}
                      >
                        상세
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(review.id);
                        }}
                        disabled={deletingId === review.id}
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
