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

interface Profitability {
    id: number;
    project_id: number;
    project_code: string | null;
    project_name: string | null;
    customer_name: string | null;
    version: number;
    status: string;
    created_at: string;
    total_revenue?: number;
    operating_profit?: number;
    operating_profit_rate?: number;
    our_mm?: number;
    other_mm?: number;
}

const sortOptions = [
    { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
    { value: "revenue_high", label: "매출 높은 순" },
    { value: "revenue_low", label: "매출 낮은 순" },
    { value: "profit_high", label: "영업이익 높은 순" },
    { value: "profit_low", label: "영업이익 낮은 순" },
    { value: "rate_high", label: "이익률 높은 순" },
    { value: "rate_low", label: "이익률 낮은 순" },
];

export default function ProfitabilityListPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [profitabilities, setProfitabilities] = useState<Profitability[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [sortOption, setSortOption] = useState("project_code_desc");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, profitabilityRes] = await Promise.all([
                fetch("/api/projects"),
                fetch("/api/profitability"),
            ]);

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                setProjects(projectsData.projects || []);
            }

            if (profitabilityRes.ok) {
                const profitabilityData = await profitabilityRes.json();
                setProfitabilities(profitabilityData.profitabilities || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const sortedProfitabilities = useMemo(() => {
        let filtered = profitabilities;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = profitabilities.filter(
                (prof) =>
                    prof.project_name?.toLowerCase().includes(query) ||
                    prof.project_code?.toLowerCase().includes(query) ||
                    prof.customer_name?.toLowerCase().includes(query)
            );
        }

        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case "revenue_high":
                    return (b.total_revenue || 0) - (a.total_revenue || 0);
                case "revenue_low":
                    return (a.total_revenue || 0) - (b.total_revenue || 0);
                case "profit_high":
                    return (b.operating_profit || 0) - (a.operating_profit || 0);
                case "profit_low":
                    return (a.operating_profit || 0) - (b.operating_profit || 0);
                case "rate_high":
                    return (b.operating_profit_rate || 0) - (a.operating_profit_rate || 0);
                case "rate_low":
                    return (a.operating_profit_rate || 0) - (b.operating_profit_rate || 0);
                case "project_code_desc":
                default:
                    if (!a.project_code) return 1;
                    if (!b.project_code) return -1;
                    return b.project_code.localeCompare(a.project_code);
            }
        });
    }, [profitabilities, sortOption, searchQuery]);

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            setDeletingId(id);
            const response = await fetch(`/api/profitability/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setProfitabilities(profitabilities.filter((prof) => prof.id !== id));
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
        router.push(`/profitability/new?projectId=${selectedProjectId}`);
    };

    const availableProjects = projects.filter(
        (project) => !profitabilities.some((prof) => prof.project_id === project.id)
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
                    <h1 className="text-2xl font-semibold text-gray-900">수지분석서 현황</h1>
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
                        수지분석서
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
                            <TableHead align="center">매출</TableHead>
                            <TableHead align="center">영업이익</TableHead>
                            <TableHead align="center">이익률</TableHead>
                            <TableHead align="center">당사 M/M</TableHead>
                            <TableHead align="center">타사 M/M</TableHead>
                            <TableHead align="center">상태</TableHead>
                            <TableHead align="center">작성일</TableHead>
                            <TableHead align="right">작업</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={12} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                                        <p className="text-sm text-gray-500">데이터를 불러오고 있습니다...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedProfitabilities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <FolderOpen className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                                        <div className="space-y-1">
                                            <p className="text-base font-medium text-gray-900">조회된 수지분석서가 없습니다</p>
                                            <p className="text-sm text-gray-500">프로젝트를 선택하여 수지분석서를 작성하세요</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedProfitabilities.map((prof) => (
                                <TableRow
                                    key={prof.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.push(`/profitability/${prof.id}`)}
                                >
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-500">{prof.project_code || "-"}</span>
                                    </TableCell>
                                    <TableCell align="left">
                                        <span className="font-medium text-gray-900">{prof.project_name}</span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-900">{prof.customer_name || "-"}</span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-900">v{prof.version}</span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm font-medium text-gray-900">
                                            {prof.total_revenue ? formatCurrency(prof.total_revenue * 1000, "KRW") : "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm font-medium text-gray-900">
                                            {prof.operating_profit ? formatCurrency(prof.operating_profit * 1000, "KRW") : "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            (prof.operating_profit_rate || 0) >= 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {prof.operating_profit_rate ? formatPercent(prof.operating_profit_rate) : "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-900">
                                            {prof.our_mm ? `${prof.our_mm.toFixed(1)} M/M` : "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-900">
                                            {prof.other_mm ? `${prof.other_mm.toFixed(1)} M/M` : "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Badge variant={getStatusVariant(prof.status)}>
                                            {getStatusLabel(prof.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell align="center">
                                        <span className="text-sm text-gray-500">
                                            {new Date(prof.created_at).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/profitability/${prof.id}`);
                                                }}
                                            >
                                                상세
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(prof.id);
                                                }}
                                                disabled={deletingId === prof.id}
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
