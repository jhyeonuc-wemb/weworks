"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FolderOpen, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

// 공통 UI 컴포넌트 임포트
import {
    Button,
    SearchInput,
    Badge,
    Dropdown,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from "@/components/ui";

interface ProjectMonitoring {
    id: string | number;
    project_code: string;
    project_name: string;
    category: string;
    field: string;
    customer: string;
    pm: string;
    pl: string;
    actual_start_date: string;
    actual_end_date: string;
    progress_status: string; // 건전성 (정상, RISK, 이슈)
    performance_rate: number;
    current_phase: string;
    progress_state: string; // 일정코드 (정상, 일정지연, 대기, 종료)
    planned_internal_mm: number;
    planned_external_mm: number;
    executed_internal_mm: number;
    executed_external_mm: number;
}

export default function ProjectMonitoringPage() {
    const router = useRouter();
    const [data, setData] = useState<ProjectMonitoring[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchYear, setSearchYear] = useState("전체");
    const [searchStatus, setSearchStatus] = useState("전체");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/monitoring');
            const json = await res.json();
            if (json.data) {
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalMM = (internal: number | string, external: number | string) => {
        return (parseFloat(String(internal || 0)) + parseFloat(String(external || 0))).toFixed(1);
    };

    const calculateRemainingMMTotal = (planInt: number | string, planExt: number | string, execInt: number | string, execExt: number | string) => {
        const totalPlan = parseFloat(String(planInt || 0)) + parseFloat(String(planExt || 0));
        const totalExec = parseFloat(String(execInt || 0)) + parseFloat(String(execExt || 0));
        return (totalPlan - totalExec).toFixed(1);
    };

    const calculateScheduleProgress = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();

        if (today < startDate) return 0;
        if (today > endDate) return 100;

        const totalDays = differenceInDays(endDate, startDate);
        if (totalDays <= 0) return 0;

        const passedDays = differenceInDays(today, startDate);
        const ratio = (passedDays / totalDays) * 100;
        return Math.min(Math.max(Math.round(ratio), 0), 100);
    };

    const handleRowClick = (projectId: string | number) => {
        router.push(`/progress-management/monitoring/${projectId}`);
    };

    // 년도 옵션 추출
    const yearOptions = useMemo(() => {
        const years = new Set<string>();
        data.forEach(item => {
            if (item.project_code && item.project_code.startsWith('P')) {
                const year = `20${item.project_code.substring(1, 3)}`;
                years.add(year);
            }
        });
        return ["전체", ...Array.from(years).sort().reverse()].map(y => ({ value: y, label: y === "전체" ? "년도" : `${y}년` }));
    }, [data]);

    const statusOptions = [
        { value: "전체", label: "진행상태" },
        { value: "정상", label: "정상" },
        { value: "일정지연", label: "일정지연" },
        { value: "대기", label: "대기" },
        { value: "종료", label: "종료" }
    ];

    const filteredData = useMemo(() => {
        let filtered = data.filter(item =>
            item.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (searchYear !== "전체") {
            filtered = filtered.filter(item => item.project_code.startsWith(`P${searchYear.substring(2, 4)}`));
        }

        if (searchStatus !== "전체") {
            filtered = filtered.filter(item => (item.progress_state || '정상') === searchStatus);
        }

        return filtered;
    }, [data, searchTerm, searchYear, searchStatus]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    return (
        <div className="space-y-8 max-w-[1920px]">
            {/* Header Section */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        프로젝트 모니터링
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={fetchData} className="flex items-center gap-2">
                        <Save className="h-4 w-4 rotate-90" />
                        새로고침
                    </Button>
                </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-wrap items-center gap-4 mx-1">
                <div className="w-64">
                    <SearchInput
                        placeholder="프로젝트, 코드, 고객사 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dropdown
                    value={searchYear}
                    onChange={(val) => setSearchYear(val as string)}
                    options={yearOptions}
                    className="w-36"
                    align="center"
                />
                <Dropdown
                    value={searchStatus}
                    onChange={(val) => setSearchStatus(val as string)}
                    options={statusOptions}
                    className="w-36"
                    align="center"
                />
            </div>

            {/* List Table Section */}
            <div className="neo-light-card overflow-hidden border border-border/40">
                <div className="overflow-x-auto custom-scrollbar-main">
                    <Table className="w-full table-fixed">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">코드</TableHead>
                                <TableHead className="px-4 py-3 text-sm text-slate-900 text-center">프로젝트명</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center">분야</TableHead>
                                <TableHead className="w-[140px] px-4 py-3 text-sm text-slate-900 text-center">고객사</TableHead>
                                <TableHead className="w-[80px] px-4 py-3 text-sm text-slate-900 text-center">PM</TableHead>
                                <TableHead className="w-[80px] px-4 py-3 text-sm text-slate-900 text-center">PL</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">단계</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">상태</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">진행 상태</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">계획(%)</TableHead>
                                <TableHead className="w-[100px] px-4 py-3 text-sm text-slate-900 text-center whitespace-nowrap">실적(%)</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-right whitespace-nowrap">계획MM</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-right whitespace-nowrap">실행MM</TableHead>
                                <TableHead className="w-[90px] px-4 py-3 text-sm text-slate-900 text-right whitespace-nowrap">잔여MM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/10">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-base font-medium text-foreground">조회된 프로젝트가 없습니다.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="hover:bg-primary/[0.02] transition-colors group cursor-pointer"
                                        onClick={() => handleRowClick(row.id)}
                                    >
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-foreground/80 font-mono font-bold">{row.project_code}</span>
                                        </TableCell>
                                        <TableCell align="left" className="px-4 py-3">
                                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1 leading-snug">
                                                {row.project_name}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-[11px] text-foreground/70">{row.field}</div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-[11px] font-bold text-indigo-600 truncate">{row.customer || '-'}</div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-[11px] font-bold text-gray-700">{row.pm || '-'}</div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap border-r border-border/5">
                                            <div className="text-[11px] font-bold text-emerald-600">{row.pl || '-'}</div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <Badge variant="default" className="bg-slate-100 text-slate-600 rounded-md text-[10px] px-1.5 h-5 border-none font-black uppercase">
                                                {row.current_phase || '미지정'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <div className={cn(
                                                "text-[11px] font-bold",
                                                (row.progress_state === '정상' || !row.progress_state) ? "text-emerald-600" : "text-slate-500"
                                            )}>
                                                {row.progress_state || '정상'}
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3 whitespace-nowrap">
                                            <Badge
                                                className={cn(
                                                    "rounded-full px-3 h-6 text-[11px] font-black border-none shadow-sm",
                                                    (row.progress_status === '정상' || !row.progress_status) ? "bg-green-100 text-green-700" :
                                                        (row.progress_status === 'RISK' || row.progress_status === '이슈') ? "bg-red-100 text-red-700" :
                                                            "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {row.progress_status || '정상'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3">
                                            <div className="flex flex-col items-center">
                                                <span className="font-mono font-bold text-[11px] text-gray-900 mb-1">{calculateScheduleProgress(row.actual_start_date, row.actual_end_date)}%</span>
                                                <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${calculateScheduleProgress(row.actual_start_date, row.actual_end_date)}%` }} />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center" className="px-4 py-3">
                                            <div className="flex flex-col items-center">
                                                <span className="font-mono font-bold text-[11px] text-gray-900 mb-1">{row.performance_rate}%</span>
                                                <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${row.performance_rate}%` }} />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 font-mono text-[13px] font-bold text-gray-600">
                                            {calculateTotalMM(row.planned_internal_mm, row.planned_external_mm)}
                                        </TableCell>
                                        <TableCell align="right" className="px-4 py-3 font-mono text-[13px] font-bold text-indigo-600">
                                            {calculateTotalMM(row.executed_internal_mm, row.executed_external_mm)}
                                        </TableCell>
                                        <TableCell align="right" className={cn(
                                            "px-4 py-3 font-mono text-[13px] font-black",
                                            parseFloat(calculateRemainingMMTotal(row.planned_internal_mm, row.planned_external_mm, row.executed_internal_mm, row.executed_external_mm)) < 0
                                                ? "text-red-500" : "text-gray-900"
                                        )}>
                                            {calculateRemainingMMTotal(row.planned_internal_mm, row.planned_external_mm, row.executed_internal_mm, row.executed_external_mm)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
                    <div className="absolute left-8 flex items-center gap-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{filteredData.length}</span></div>
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

                    <div className="absolute right-8 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-primary transition-colors font-mono"
                        >
                            {[10, 20, 30, 50, 100].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
