"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
    SearchInput,
    Dropdown,
    Button,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    StatusBadge,
} from "@/components/ui";

interface Contract {
    id: number;
    projectCode: string | null;
    name: string;
    customerName: string | null;
    ordererName: string | null;
    managerName: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
    expectedAmount: number | null;
    currentPhase: string;
    contractStatus: string;
    contractCount: number;
    totalContractAmount: number | null;
    startedAt: string | null;
    completedAt: string | null;
}

interface Project {
    id: number;
    projectCode: string | null;
    name: string;
    customerName: string | null;
    ordererName: string | null;
}

interface Meta {
    total: number;
}


const sortOptions = [
    { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
    { value: "project_code_asc", label: "프로젝트 코드순 (오래된)" },
    { value: "amount_high", label: "계약 금액 높은 순" },
    { value: "amount_low", label: "계약 금액 낮은 순" },
    { value: "date_recent", label: "최신 계약일순" },
];

export default function ContractStatusPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0 });
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchYear, setSearchYear] = useState("전체");
    const [searchStatus, setSearchStatus] = useState("전체");
    const [sortOption, setSortOption] = useState("project_code_desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (searchYear !== "전체") params.set("year", searchYear);
            if (searchStatus !== "전체") params.set("status", searchStatus);

            const [contractsRes, projectsRes] = await Promise.all([
                fetch(`/api/contracts?${params.toString()}`),
                fetch("/api/projects"),
            ]);
            if (contractsRes.ok) {
                const data = await contractsRes.json();
                setContracts(data.contracts || []);
                setMeta({ total: data.meta?.total || 0 });
            }
            if (projectsRes.ok) {
                const data = await projectsRes.json();
                setProjects(data.projects || []);
            }
        } catch (e) {
            console.error("계약 현황 조회 오류:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, searchYear, searchStatus]);

    // 연도 옵션
    const yearOptions = useMemo(() => {
        const years = new Set<string>();
        contracts.forEach((c) => {
            if (c.projectCode) {
                const match = c.projectCode.match(/^P(\d{2})-/);
                if (match) years.add(`20${match[1]}`);
            }
        });
        return [
            { value: "전체", label: "연도" },
            ...Array.from(years).sort().reverse().map((y) => ({ value: y, label: `${y}년` })),
        ];
    }, [contracts]);

    // 상태 옵션
    const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([
        { value: "전체", label: "상태" },
    ]);

    useEffect(() => {
        fetch(`/api/settings/phase-statuses?phaseCode=contract`)
            .then((res) => res.json())
            .then((data) => {
                if (data.statuses?.length > 0) {
                    setStatusOptions([
                        { value: "전체", label: "상태" },
                        ...data.statuses.map((s: { code: string; name: string }) => ({ value: s.code, label: s.name })),
                    ]);
                }
            })
            .catch(console.error);
    }, []);

    // 계약이 없는 프로젝트만 드롭다운에 표시
    const availableProjects = projects.filter(
        (p) => !contracts.some((c) => c.id === p.id)
    );
    const projectOptions = availableProjects
        .slice()
        .sort((a, b) => (b.projectCode || "").localeCompare(a.projectCode || ""))
        .map((p) => ({
            value: p.id,
            label: `${p.projectCode || "N/A"}_${p.name}`,
        }));

    const handleCreateNew = () => {
        if (!selectedProjectId) {
            alert("프로젝트를 선택해주세요.");
            return;
        }
        router.push(`/projects/${selectedProjectId}/contract`);
    };

    // 정렬
    const sortedContracts = useMemo(() => {
        return [...contracts].sort((a, b) => {
            switch (sortOption) {
                case "amount_high":
                    return (b.expectedAmount || 0) - (a.expectedAmount || 0);
                case "amount_low":
                    return (a.expectedAmount || 0) - (b.expectedAmount || 0);
                case "date_recent":
                    return (b.contractStartDate || "").localeCompare(a.contractStartDate || "");
                case "project_code_asc":
                    if (!a.projectCode) return 1;
                    if (!b.projectCode) return -1;
                    return a.projectCode.localeCompare(b.projectCode);
                case "project_code_desc":
                default:
                    if (!a.projectCode) return 1;
                    if (!b.projectCode) return -1;
                    return b.projectCode.localeCompare(a.projectCode);
            }
        });
    }, [contracts, sortOption]);

    // 페이지네이션
    const totalPages = Math.ceil(sortedContracts.length / itemsPerPage);
    const paginatedContracts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedContracts.slice(start, start + itemsPerPage);
    }, [sortedContracts, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, searchYear, searchStatus, sortOption, itemsPerPage]);

    return (
        <div className="space-y-8 max-w-[1920px]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        계약 현황
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
                        listAlign="left"
                        listClassName="min-w-[400px]"
                    />
                    <Button
                        variant="primary"
                        onClick={handleCreateNew}
                        disabled={!selectedProjectId}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        계약
                    </Button>
                </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mx-1">
                <div className="w-64">
                    <SearchInput
                        placeholder="프로젝트명, 코드, 고객사 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Dropdown
                    value={searchYear}
                    onChange={(v) => setSearchYear(v as string)}
                    options={yearOptions}
                    className="w-40"
                    align="center"
                    listAlign="left"
                />
                <Dropdown
                    value={searchStatus}
                    onChange={(v) => setSearchStatus(v as string)}
                    options={statusOptions}
                    className="w-36"
                    align="center"
                    listAlign="left"
                />
                <div className="ml-auto">
                    <Dropdown
                        value={sortOption}
                        onChange={(v) => setSortOption(v as string)}
                        options={sortOptions}
                        className="w-56"
                        align="center"
                        listAlign="left"
                    />
                </div>
            </div>

            {/* 테이블 */}
            <div className="neo-light-card overflow-hidden border border-border/40">
                <div className="overflow-x-auto custom-scrollbar-main">
                    <Table className="w-full table-fixed">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[110px] px-8 py-3 text-sm text-slate-900 text-center whitespace-nowrap">
                                    코드
                                </TableHead>
                                <TableHead className="px-8 py-3 text-sm text-slate-900 text-left whitespace-nowrap">
                                    프로젝트명
                                </TableHead>
                                <TableHead className="w-[160px] px-8 py-3 text-sm text-slate-900 text-center whitespace-nowrap">
                                    고객사
                                </TableHead>
                                <TableHead className="w-[150px] px-4 py-3 text-sm text-slate-900 text-right whitespace-nowrap">
                                    계약금액(원)
                                </TableHead>
                                <TableHead className="w-[210px] px-8 py-3 text-sm text-slate-900 text-center whitespace-nowrap">
                                    계약기간
                                </TableHead>
                                <TableHead className="w-[110px] px-8 py-3 text-sm text-slate-900 text-center whitespace-nowrap">
                                    상태
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/10">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground font-medium">
                                                데이터를 불러오고 있습니다...
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                <FileSignature className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-medium text-foreground">
                                                    계약 단계의 프로젝트가 없습니다
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    VRB가 완료된 프로젝트가 계약 단계로 진입합니다.
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedContracts.map((contract) => (
                                    <TableRow
                                        key={contract.id}
                                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/projects/${contract.id}/contract`)}
                                    >
                                        <TableCell align="center" className="px-8 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground font-mono">
                                                {contract.projectCode || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="left" className="px-8 py-3">
                                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-2 leading-snug">
                                                {contract.name}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-8 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground font-medium">
                                                {contract.customerName || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-emerald-600 font-bold font-mono">
                                                {contract.totalContractAmount
                                                    ? formatNumber(contract.totalContractAmount)
                                                    : contract.expectedAmount
                                                        ? formatNumber(contract.expectedAmount)
                                                        : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-8 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground font-medium">
                                                {contract.contractStartDate
                                                    ? `${contract.contractStartDate.slice(2).replace(/-/g, '.')}~${contract.contractEndDate ? contract.contractEndDate.slice(2).replace(/-/g, '.') : "?"}`
                                                    : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-8 py-3 whitespace-nowrap">
                                            <div className="flex items-center justify-center">
                                                <StatusBadge status={contract.contractStatus} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* 푸터 */}
                <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
                    <div className="absolute left-8 flex items-center gap-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            TOTAL :{" "}
                            <span className="text-primary ml-1">{sortedContracts.length}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-border/40 pl-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                ROWS :
                            </span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-primary transition-colors"
                            >
                                {[10, 20, 30, 50].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
