import React, { useMemo, useState } from 'react';
import { Edit, Trash2, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ProjectPhase } from './schema';

interface PhaseListProps {
    phases: ProjectPhase[];
    loading: boolean;
    onEdit: (phase: ProjectPhase, rect: DOMRect) => void;
    onDelete: (id: number) => void;
}

const ITEMS_PER_PAGE = 20;

export function PhaseList({ phases, loading, onEdit, onDelete }: PhaseListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(phases.length / ITEMS_PER_PAGE);

    const paginatedPhases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return phases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [phases, currentPage]);

    return (
        <div className="neo-light-card overflow-hidden border border-border/40">
            <div className="overflow-x-auto custom-scrollbar-main">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="h-[46px]">
                            <TableHead className="px-8 py-0 text-center text-sm text-slate-900 w-16">순서</TableHead>
                            <TableHead className="px-8 py-0 text-left text-sm text-slate-900">그룹</TableHead>
                            <TableHead className="px-8 py-0 text-left text-sm text-slate-900">단계명</TableHead>
                            <TableHead className="px-8 py-0 text-left text-sm text-slate-900">경로</TableHead>
                            <TableHead className="px-8 py-0 text-left text-sm text-slate-900">설명</TableHead>
                            <TableHead className="px-8 py-0 text-right text-sm text-slate-900">작업</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/10">
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-8 py-24 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : phases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-8 py-24 text-center border-none">
                                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                        <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">등록된 단계가 없습니다</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedPhases.map((phase) => (
                                <TableRow key={phase.id} className="h-[46px] hover:bg-primary/[0.02] transition-colors group">
                                    <TableCell className="text-center px-8 py-0">
                                        <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                            {phase.display_order}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap px-8 py-0">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                                            phase.phase_group === 'sales_ps'
                                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                                : phase.phase_group === 'maintenance'
                                                    ? "bg-purple-50 text-purple-700 border border-purple-100"
                                                    : phase.phase_group === 'closure'
                                                        ? "bg-orange-50 text-orange-700 border border-orange-100"
                                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        )}>
                                            {phase.phase_group === 'sales_ps' ? '영업/PS' : phase.phase_group === 'maintenance' ? '유지보수' : phase.phase_group === 'closure' ? '종료' : '프로젝트'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap px-8 py-0">
                                        <div className="text-sm font-bold text-foreground tracking-tight">
                                            {phase.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap px-8 py-0">
                                        <code className="text-xs bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                                            {phase.path || "-"}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-8 py-0 text-sm font-medium text-muted-foreground/80 max-w-[200px] truncate">
                                        {phase.description || "-"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap px-8 py-0 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={(e) => onEdit(phase, e.currentTarget.getBoundingClientRect())}
                                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                title="수정"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(phase.id)}
                                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                                title="삭제"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
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
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{phases.length}</span></div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-xs transition-all",
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
                            className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
