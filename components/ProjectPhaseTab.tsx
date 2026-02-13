"use client";

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Edit, Trash2, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Button,
    DraggablePanel,
    Dropdown,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProjectPhase {
    id: number;
    code: string;
    name: string;
    phase_group: string; // 'sales_ps' | 'project' | 'maintenance'
    path: string | null;
    display_order: number;
    is_active: boolean;
    description: string | null;
}

export interface ProjectPhaseTabHandle {
    handleAdd: (rect?: DOMRect) => void;
}

export const ProjectPhaseTab = forwardRef<ProjectPhaseTabHandle>((_, ref) => {
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchPhases();
    }, []);

    const fetchPhases = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/settings/phases");
            if (response.ok) {
                const data = await response.json();
                setPhases(data.phases || []);
            }
        } catch (error) {
            console.error("Error fetching phases:", error);
        } finally {
            setLoading(false);
        }
    };

    const paginatedPhases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return phases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [phases, currentPage]);

    const totalPages = Math.ceil(phases.length / ITEMS_PER_PAGE);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        phase_group: "sales_ps",
        path: "",
        display_order: "0",
        is_active: true,
        description: "",
    });

    useImperativeHandle(ref, () => ({
        handleAdd: (rect?: DOMRect) => {
            const nextOrder = phases.length > 0 ? Math.max(...phases.map(p => p.display_order)) + 1 : 1;
            setFormData({
                code: "",
                name: "",
                phase_group: "sales_ps",
                path: "",
                display_order: nextOrder.toString(),
                is_active: true,
                description: ""
            });
            if (rect) setTriggerRect(rect);
            setIsEditMode(false);
            setEditingPhase(null);
            setIsModalOpen(true);
        }
    }));

    const handleEdit = (phase: ProjectPhase, e: React.MouseEvent) => {
        setFormData({
            code: phase.code,
            name: phase.name,
            phase_group: phase.phase_group,
            path: phase.path || "",
            display_order: phase.display_order.toString(),
            is_active: phase.is_active,
            description: phase.description || "",
        });
        setTriggerRect(e.currentTarget.getBoundingClientRect());
        setEditingPhase(phase);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("정말 이 단계를 삭제하시겠습니까? 프로젝트에 영향이 있을 수 있습니다.")) {
            try {
                const response = await fetch(`/api/settings/phases?id=${id}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    await fetchPhases();
                } else {
                    const error = await response.json();
                    alert(`삭제 실패: ${error.error || "알 수 없는 오류"}`);
                }
            } catch (error) {
                console.error("Error deleting phase:", error);
                alert("삭제에 실패했습니다.");
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                display_order: parseInt(formData.display_order) || 0,
            };

            if (isEditMode && editingPhase) {
                const response = await fetch("/api/settings/phases", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editingPhase.id,
                        ...payload
                    }),
                });
                if (response.ok) {
                    await fetchPhases();
                    setIsModalOpen(false);
                } else {
                    const error = await response.json();
                    alert(`수정 실패: ${error.error}`);
                }
            } else {
                const response = await fetch("/api/settings/phases", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (response.ok) {
                    await fetchPhases();
                    setIsModalOpen(false);
                } else {
                    const error = await response.json();
                    alert(`추가 실패: ${error.error}`);
                }
            }
        } catch (error) {
            console.error("Error saving phase:", error);
            alert("저장에 실패했습니다.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="neo-light-card overflow-hidden border border-border/40">
                <div className="overflow-x-auto custom-scrollbar-main">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="px-8 py-3 text-center text-sm text-slate-900 w-16">순서</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">그룹</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">단계명</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">경로</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">설명</TableHead>
                                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">작업</TableHead>
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
                                    <TableRow key={phase.id} className="hover:bg-primary/[0.02] transition-colors group">
                                        <TableCell className="text-center px-8 py-3">
                                            <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                                {phase.display_order}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-3">
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                                                phase.phase_group === 'sales_ps'
                                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                                    : phase.phase_group === 'maintenance'
                                                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            )}>
                                                {phase.phase_group === 'sales_ps' ? '영업/PS' : phase.phase_group === 'maintenance' ? '유지보수' : '프로젝트'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-3">
                                            <div className="text-sm font-bold text-foreground tracking-tight">
                                                {phase.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-3">
                                            <code className="text-xs bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                                                {phase.path || "-"}
                                            </code>
                                        </TableCell>
                                        <TableCell className="px-8 py-3 text-sm font-medium text-muted-foreground/80 max-w-[200px] truncate">
                                            {phase.description || "-"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                <button
                                                    onClick={(e) => handleEdit(phase, e)}
                                                    className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                    title="수정"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(phase.id)}
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
                <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-foreground/50">TOTAL : <span className="text-primary ml-1">{phases.length}</span></div>
                    </div>

                    {totalPages > 1 && (
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
                    )}
                </div>
            </div>

            <DraggablePanel
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                triggerRect={triggerRect}
                title={isEditMode ? "단계 정보 수정" : "신규 단계 등록"}
                description="프로젝트 라이프사이클 단계를 정의합니다."
                className="max-w-lg"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">
                                그룹 구분 <span className="text-primary">*</span>
                            </label>
                            <Dropdown
                                value={formData.phase_group}
                                onChange={(val) => setFormData({ ...formData, phase_group: val as string })}
                                options={[
                                    { value: 'sales_ps', label: '영업/PS' },
                                    { value: 'project', label: '프로젝트' },
                                    { value: 'maintenance', label: '유지보수' },
                                ]}
                                placeholder="그룹 선택"
                                variant="standard"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">
                                표시 순서 <span className="text-primary">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                                placeholder="예: 1"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">
                            단계 코드 (ID) {!isEditMode && <span className="text-primary">*</span>}
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            disabled={isEditMode}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="예: lead, opportunity (영문 소문자)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all disabled:bg-muted/30 disabled:text-muted-foreground/60"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">
                            단계명 <span className="text-primary">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="화면에 표시될 이름"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">경로 (Path)</label>
                        <input
                            type="text"
                            value={formData.path}
                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                            placeholder="예: /md-estimation (없으면 빈 칸)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">설명</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="단계에 대한 설명"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-100">
                        <input
                            id="is-active"
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <label htmlFor="is-active" className="text-xs font-medium text-gray-700 cursor-pointer">
                            사용 여부 (활성화)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setIsEditMode(false);
                            }}
                        >
                            취소
                        </Button>
                        <Button
                            className="px-8 min-w-[120px]"
                        >
                            저장
                        </Button>
                    </div>
                </form>
            </DraggablePanel>
        </div>
    );
});

ProjectPhaseTab.displayName = "ProjectPhaseTab";
