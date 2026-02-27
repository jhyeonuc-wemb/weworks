"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SearchInput, Dropdown, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";

interface Contract {
    id: number;
    project_id: number;
    project_code: string | null;
    project_name: string;
    customer_name: string | null;
    orderer_name: string | null;
    contract_amount: number | null;
    contract_start_date: string | null;
    contract_end_date: string | null;
    status: string;
}

const sortOptions = [
    { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
    { value: "amount_high", label: "계약 금액 높은 순" },
    { value: "amount_low", label: "계약 금액 낮은 순" },
    { value: "date_recent", label: "최신 계약일순" },
];

export default function ContractListPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchYear, setSearchYear] = useState("전체");
    const [searchStatus, setSearchStatus] = useState("전체");
    const [statusOptions, setStatusOptions] = useState<{ value: string, label: string }[]>([{ value: "전체", label: "상태" }]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    // 임시 데이터 (실제 API 연동 전)
    const [contracts, setContracts] = useState<Contract[]>([
        {
            id: 1,
            project_id: 101,
            project_code: "P2024-001",
            project_name: "AI 기반 스마트 팩토리 대시보드 구축",
            customer_name: "(주)현대자동차",
            orderer_name: "(주)현대자동차",
            contract_amount: 150000000,
            contract_start_date: "2024-03-01",
            contract_end_date: "2024-08-31",
            status: "COMPLETED",
        },
        {
            id: 2,
            project_id: 102,
            project_code: "P2024-002",
            project_name: "차세대 메타버스 컨퍼런스 시스템",
            customer_name: "SK텔레콤",
            orderer_name: "SK텔레콤",
            contract_amount: 85000000,
            contract_start_date: "2024-04-15",
            contract_end_date: "2024-10-14",
            status: "IN_PROGRESS",
        },
        {
            id: 3,
            project_id: 103,
            project_code: "P2024-003",
            project_name: "IoT 센서 데이터 통합 관리 시스템",
            customer_name: "LG전자",
            orderer_name: "LG전자",
            contract_amount: 120000000,
            contract_start_date: "2024-05-01",
            contract_end_date: "2024-12-31",
            status: "STANDBY",
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [sortOption, setSortOption] = useState("project_code_desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const sortedContracts = useMemo(() => {
        let filtered = contracts;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.project_name?.toLowerCase().includes(query) ||
                    c.project_code?.toLowerCase().includes(query) ||
                    c.customer_name?.toLowerCase().includes(query)
            );
        }

        if (searchYear !== "전체") {
            filtered = filtered.filter(c => {
                if (!c.project_code) return false;
                const match = c.project_code.match(/^P(\d{2})-/);
                if (match) {
                    const year = `20${match[1]}`;
                    return year === searchYear;
                }
                return false;
            });
        }

        if (searchStatus !== "전체") {
            filtered = filtered.filter(c => c.status === searchStatus);
        }

        return [...filtered].sort((a, b) => {
            switch (sortOption) {
                case "amount_high":
                    return (b.contract_amount || 0) - (a.contract_amount || 0);
                case "amount_low":
                    return (a.contract_amount || 0) - (b.contract_amount || 0);
                case "date_recent":
                    return (b.contract_start_date || "").localeCompare(a.contract_start_date || "");
                case "project_code_desc":
                default:
                    if (!a.project_code) return 1;
                    if (!b.project_code) return -1;
                    return b.project_code.localeCompare(a.project_code);
            }
        });
    }, [contracts, sortOption, searchQuery, searchYear, searchStatus]);

    const paginatedContracts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedContracts.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedContracts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedContracts.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, searchYear, searchStatus, sortOption, itemsPerPage]);

    const startYears = useMemo(() => {
        const years = new Set<string>();
        contracts.forEach(c => {
            if (c.project_code) {
                const match = c.project_code.match(/^P(\d{2})-/);
                if (match) {
                    years.add(`20${match[1]}`);
                }
            }
        });
        return ["전체", ...Array.from(years).sort().reverse()];
    }, [contracts]);

    const yearOptions = startYears.map(year => ({ value: year, label: year === "전체" ? "년도" : `${year}년` }));

    useEffect(() => {
        fetch(`/api/codes?parentCode=CONTRACT`)
            .then(res => res.json())
            .then(data => {
                if (data.codes && data.codes.length > 0) {
                    const opts = data.codes.map((c: any) => ({ value: c.code, label: c.name }));
                    setStatusOptions([{ value: "전체", label: "상태" }, ...opts]);
                }
            })
            .catch(console.error);
    }, []);

    const getStatusVariant = (status: string): "success" | "warning" | "info" | "default" => {
        if (status === "COMPLETED") return "success";
        if (status === "IN_PROGRESS") return "warning";
        return "info";
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            STANDBY: "대기",
            IN_PROGRESS: "진행 중",
            COMPLETED: "완료",
        };
        return labels[status] || status;
    };

    return (
        <div className="space-y-8 max-w-[1920px]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">계약 현황</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        className="flex items-center gap-2 border-slate-200"
                    >
                        <Download className="h-4 w-4 mr-1.5" />
                        엑셀 다운로드
                    </Button>
                    <Button
                        variant="primary"
                        disabled={true}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        계약 등록
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
                                <TableHead className="px-4 py-3 text-sm text-slate-900 text-left whitespace-nowrap">프로젝트명</TableHead>
                                <TableHead className="w-[150px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">고객사</TableHead>
                                <TableHead className="w-[140px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">계약 금액</TableHead>
                                <TableHead className="w-[200px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">계약 기간</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">상태</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/10">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-medium text-foreground">조회된 계약 내역이 없습니다</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedContracts.map((contract) => (
                                    <TableRow
                                        key={contract.id}
                                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/projects/${contract.project_id}`)}
                                    >
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono">
                                                {contract.project_code || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="left" className="px-4 py-3">
                                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-2 leading-snug">
                                                {contract.project_name}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-medium">
                                                {contract.customer_name || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-indigo-600 font-black font-mono">
                                                {contract.contract_amount ? `₩${formatNumber(contract.contract_amount)}` : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/60 font-mono">
                                                {contract.contract_start_date ? `${contract.contract_start_date} ~ ${contract.contract_end_date}` : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <Badge variant={getStatusVariant(contract.status)} className="h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border-none">
                                                {getStatusLabel(contract.status)}
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
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{sortedContracts.length}</span></div>

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
