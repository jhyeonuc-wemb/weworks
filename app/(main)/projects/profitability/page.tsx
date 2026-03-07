"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusBadge } from "@/components/ui";
import { useProjects } from "@/hooks/queries/useProjects";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";

interface Project {
    id: number;
    projectCode: string | null;
    name: string;
    customerName: string | null;
}

interface Profitability {
    id: number;
    project_id: number;
    projectCode: string | null;
    project_name: string | null;
    customerName: string | null;
    version: number;
    status: string;
    created_at: string;
    total_revenue?: number;
    operating_profit?: number;
    operating_profit_rate?: number;
    our_mm?: number;
    others_mm?: number;
    creator_name?: string;
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
    const [searchYear, setSearchYear] = useState("전체");
    const [searchStatus, setSearchStatus] = useState("전체");
    const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([{ value: "전체", label: "상태" }]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [sortOption, setSortOption] = useState("project_code_desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // ✅ SWR 훅으로 병렬 조회
    const { projects: rawProjects, isLoading: projectsLoading } = useProjects();
    const { data: profitData, isLoading: profitLoading, mutate: mutateProfitabilities } = useSWR("/api/profitability?latestOnly=true", fetcher, { revalidateOnFocus: false });
    const projects = (rawProjects ?? []) as Project[];
    const profitabilities = (profitData?.profitabilities ?? []) as Profitability[];
    const loading = projectsLoading || profitLoading;

    const sortedProfitabilities = useMemo(() => {
        let filtered = profitabilities;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (prof) =>
                    prof.project_name?.toLowerCase().includes(query) ||
                    prof.projectCode?.toLowerCase().includes(query) ||
                    prof.customerName?.toLowerCase().includes(query)
            );
        }

        if (searchYear !== "전체") {
            filtered = filtered.filter(prof => {
                if (!prof.projectCode) return false;
                const match = prof.projectCode.match(/^P(\d{2})-/);
                if (match) {
                    const year = `20${match[1]}`;
                    return year === searchYear;
                }
                return false;
            });
        }

        if (searchStatus !== "전체") {
            filtered = filtered.filter(prof => prof.status === searchStatus);
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
                    if (!a.projectCode) return 1;
                    if (!b.projectCode) return -1;
                    return b.projectCode.localeCompare(a.projectCode);
            }
        });
    }, [profitabilities, sortOption, searchQuery, searchYear, searchStatus]);

    const paginatedProfitabilities = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedProfitabilities.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedProfitabilities, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedProfitabilities.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, searchYear, searchStatus, sortOption, itemsPerPage]);

    const startYears = useMemo(() => {
        const years = new Set<string>();
        profitabilities.forEach(p => {
            if (p.projectCode) {
                const match = p.projectCode.match(/^P(\d{2})-/);
                if (match) {
                    years.add(`20${match[1]}`);
                }
            }
        });
        return ["전체", ...Array.from(years).sort().reverse()];
    }, [profitabilities]);

    const yearOptions = startYears.map(year => ({ value: year, label: year === "전체" ? "년도" : `${year}년` }));

    useEffect(() => {
        fetch(`/api/settings/phase-statuses?phaseCode=profitability`)
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
            const response = await fetch(`/api/profitability/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                mutateProfitabilities((prev: any) => prev ? { ...prev, profitabilities: (prev.profitabilities || []).filter((p: any) => p.id !== id) } : prev, false);
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
        router.push(`/projects/${selectedProjectId}/profitability`);
    };

    const availableProjects = projects.filter(
        (project) => !profitabilities.some((prof) => prof.project_id === project.id)
    );

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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">수지분석서 현황</h1>
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
                        수지분석서
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
                                <TableHead className="w-[150px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">고객사</TableHead>
                                <TableHead className="w-[130px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">수주합계(원)</TableHead>
                                <TableHead className="w-[130px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">손익(원)</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">손익률</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">당사 M/M</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">타사 M/M</TableHead>
                                <TableHead className="w-[80px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">버전</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">상태</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/10">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedProfitabilities.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-medium text-foreground">조회된 수지 분석 내역이 없습니다</p>
                                                <p className="text-sm text-muted-foreground">프로젝트를 선택하여 수지 분석을 시작하세요</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedProfitabilities.map((p) => (
                                    <TableRow
                                        key={p.id}
                                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/projects/${p.project_id}/profitability`)}
                                    >
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                {p.projectCode || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="left" className="px-4 py-3">
                                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-2 leading-snug">
                                                {p.project_name}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80">
                                                {p.customerName || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                {formatCurrency((p.total_revenue || 0) * 1000, "KRW", false)}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className={cn(
                                                "text-sm font-bold font-mono",
                                                (p.operating_profit || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {formatCurrency((p.operating_profit || 0) * 1000, "KRW", false)}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className={cn(
                                                "text-sm font-bold font-mono",
                                                (p.operating_profit_rate || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {formatPercent(p.operating_profit_rate || 0)}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                {Number(p.our_mm || 0).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                {Number(p.others_mm || 0).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                V{p.version}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center justify-center">
                                                <StatusBadge status={p.status} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
                    <div className="absolute left-8 flex items-center gap-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedProfitabilities.length}</span></div>

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
