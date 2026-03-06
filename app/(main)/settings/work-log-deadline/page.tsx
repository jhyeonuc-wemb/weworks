"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Lock,
    Unlock,
    ShieldCheck,
    Calendar,
    Settings2,
    Save,
} from "lucide-react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Button,
    DraggablePanel,
    useToast,
    Dropdown,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface DeadlineConfig {
    id: number;
    deadline_day: number;
    is_enabled: boolean;
}

interface DeadlineUnlock {
    id: number;
    target_year: number;
    target_month: number;
    reason: string | null;
    created_at: string;
    created_by_name: string | null;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}월` }));
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(y => ({
    value: y.toString(), label: `${y}년`,
}));

export default function WorkLogDeadlinePage() {
    const { showToast, confirm } = useToast();

    const [config, setConfig] = useState<DeadlineConfig>({ id: 1, deadline_day: 4, is_enabled: true });
    const [configLoading, setConfigLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [editDeadlineDay, setEditDeadlineDay] = useState(4);
    const [editIsEnabled, setEditIsEnabled] = useState(true);

    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [unlocks, setUnlocks] = useState<DeadlineUnlock[]>([]);
    const [unlocksLoading, setUnlocksLoading] = useState(false);

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const [addForm, setAddForm] = useState({
        target_year: currentYear,
        target_month: new Date().getMonth() + 1,
        reason: "",
    });

    const fetchConfig = async () => {
        try {
            setConfigLoading(true);
            const res = await fetch("/api/settings/work-log-deadline");
            if (res.ok) {
                const data = await res.json();
                setConfig(data.config);
                setEditDeadlineDay(data.config.deadline_day);
                setEditIsEnabled(data.config.is_enabled);
            }
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchUnlocks = async () => {
        try {
            setUnlocksLoading(true);
            const res = await fetch(`/api/settings/work-log-deadline/unlocks?year=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setUnlocks(data.unlocks || []);
            }
        } finally {
            setUnlocksLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);
    useEffect(() => { fetchUnlocks(); }, [selectedYear]);

    const handleSaveConfig = async () => {
        if (editDeadlineDay < 1 || editDeadlineDay > 28) {
            showToast("마감일은 1~28 사이로 입력해주세요.", "error");
            return;
        }
        setSavingConfig(true);
        try {
            const res = await fetch("/api/settings/work-log-deadline", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deadline_day: editDeadlineDay, is_enabled: editIsEnabled }),
            });
            if (res.ok) {
                showToast("마감 설정이 저장되었습니다.", "success");
                fetchConfig();
            } else {
                const err = await res.json();
                showToast(err.error || "저장에 실패했습니다.", "error");
            }
        } finally {
            setSavingConfig(false);
        }
    };

    const handleAddUnlock = async () => {
        const res = await fetch("/api/settings/work-log-deadline/unlocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addForm),
        });
        if (res.ok) {
            showToast(`${addForm.target_year}년 ${addForm.target_month}월 마감이 해제되었습니다.`, "success");
            setIsPanelOpen(false);
            fetchUnlocks();
        } else {
            const err = await res.json();
            showToast(err.error || "저장에 실패했습니다.", "error");
        }
    };

    const handleDeleteUnlock = (unlock: DeadlineUnlock) => {
        confirm({
            title: "마감 해제 취소",
            message: `${unlock.target_year}년 ${unlock.target_month}월의 마감 해제를 취소하고 다시 마감 처리하시겠습니까?`,
            onConfirm: async () => {
                const res = await fetch(`/api/settings/work-log-deadline/unlocks/${unlock.id}`, { method: "DELETE" });
                if (res.ok) {
                    showToast("마감 해제가 취소되었습니다.", "success");
                    fetchUnlocks();
                } else {
                    showToast("삭제에 실패했습니다.", "error");
                }
            },
        });
    };

    const isConfigChanged = editDeadlineDay !== config.deadline_day || editIsEnabled !== config.is_enabled;

    return (
        <div className="space-y-8">

            {/* Header Section — holidays 패턴 */}
            <div className="flex items-start justify-between px-2">
                <div>
                    <div className="h-10 flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            작업일지 마감 설정
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        매월 작업일지 입력 마감일을 설정하고, 특정 월의 마감을 해제하여 소급 입력을 허용합니다.
                    </p>
                </div>
            </div>

            {/* 단일 카드 — 마감 기본 설정 + 월별 해제 테이블 */}
            <div className="neo-light-card overflow-hidden border border-border/40 bg-white">

                {/* ── 마감 기본 설정 ───────────────────────────── */}
                <div className="px-8 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Settings2 className="h-5 w-5 text-slate-600" />
                        <h2 className="text-base font-bold text-slate-900">마감 기본 설정</h2>
                        <span className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-full",
                            editIsEnabled
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-gray-100 text-gray-400 border border-gray-200"
                        )}>
                            {editIsEnabled ? "마감 활성화됨" : "마감 비활성화"}
                        </span>
                        <div className="ml-auto">
                            <button
                                type="button"
                                onClick={handleSaveConfig}
                                disabled={savingConfig || !isConfigChanged}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {savingConfig ? "저장 중..." : "저장"}
                            </button>
                        </div>
                    </div>

                    {configLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 마감 기능 활성화 토글 */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditIsEnabled(prev => !prev)}
                                    className={cn(
                                        "flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                                        editIsEnabled ? "bg-slate-900" : "bg-gray-300"
                                    )}
                                >
                                    <span className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                                        editIsEnabled ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">마감 기능 사용</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        비활성화하면 모든 사용자가 제한 없이 입력할 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            {/* 마감일 설정 */}
                            <div className={cn("space-y-3 transition-opacity", !editIsEnabled && "opacity-40 pointer-events-none")}>
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">마감일 설정</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
                                        <Calendar className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm text-gray-600">전월 마감: 다음 달</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={28}
                                            value={editDeadlineDay}
                                            onChange={e => setEditDeadlineDay(Number(e.target.value))}
                                            className="w-16 h-9 rounded-lg border border-gray-300 text-center text-sm font-bold text-slate-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                        />
                                        <span className="text-sm text-gray-600">일까지</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        예: 3월 작업일지 → <strong>4월 {editDeadlineDay}일</strong>까지 입력 가능
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* ── 월별 마감 해제 테이블 ───────────────────── */}
                <div className="px-8 pt-6 pb-2">
                    <div className="flex items-center gap-3 mb-4">
                        <Unlock className="h-5 w-5 text-slate-600" />
                        <div>
                            <h2 className="text-base font-bold text-slate-900">월별 마감 해제</h2>
                            <p className="text-xs text-muted-foreground">특정 월의 마감을 해제하여 소급 입력을 허용합니다.</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Dropdown
                                value={selectedYear}
                                onChange={val => setSelectedYear(val.toString())}
                                options={YEAR_OPTIONS}
                                variant="premium"
                                align="center"
                                className="w-36"
                                placeholder="연도 선택"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    setAddForm({ target_year: Number(selectedYear), target_month: new Date().getMonth() + 1, reason: "" });
                                    setTriggerRect(e.currentTarget.getBoundingClientRect());
                                    setIsPanelOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                마감 해제
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-8 mb-6 rounded-xl overflow-hidden border border-border/20">
                    <div className="overflow-x-auto custom-scrollbar-main">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="h-[46px]">
                                    <TableHead className="px-8 py-0 text-left text-sm text-slate-900 w-[120px] whitespace-nowrap">연도</TableHead>
                                    <TableHead className="px-8 py-0 text-left text-sm text-slate-900 w-[100px] whitespace-nowrap">월</TableHead>
                                    <TableHead className="px-8 py-0 text-left text-sm text-slate-900 whitespace-nowrap">해제 사유</TableHead>
                                    <TableHead className="px-8 py-0 text-left text-sm text-slate-900 w-[140px] whitespace-nowrap">해제자</TableHead>
                                    <TableHead className="px-8 py-0 text-left text-sm text-slate-900 w-[160px] whitespace-nowrap">해제 일시</TableHead>
                                    <TableHead className="px-8 py-0 text-right text-sm text-slate-900 w-[100px] whitespace-nowrap">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border/10">
                                {unlocksLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-8 py-[14px] text-center border-none">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : unlocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-8 py-[14px] text-center border-none">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                    <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                                <p className="text-sm font-medium text-foreground">{selectedYear}년에 해제된 마감 내역이 없습니다</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    unlocks.map(unlock => (
                                        <TableRow key={unlock.id} className="h-[46px] hover:bg-primary/[0.02] transition-colors group">
                                            <TableCell className="px-8 py-0 text-sm font-mono text-slate-600">{unlock.target_year}년</TableCell>
                                            <TableCell className="px-8 py-0 text-sm text-slate-600">
                                                {unlock.target_month}월
                                            </TableCell>
                                            <TableCell className="px-8 py-0 text-sm text-slate-600">
                                                {unlock.reason || <span className="text-muted-foreground/40 italic">사유 없음</span>}
                                            </TableCell>
                                            <TableCell className="px-8 py-0 text-sm text-slate-600">{unlock.created_by_name || "-"}</TableCell>
                                            <TableCell className="px-8 py-0 text-sm font-mono text-slate-500 whitespace-nowrap">
                                                {unlock.created_at
                                                    ? (() => {
                                                        const d = new Date(new Date(unlock.created_at).getTime() + 9 * 60 * 60 * 1000);
                                                        return d.toISOString().slice(0, 16).replace('T', ' ');
                                                    })()
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="px-8 py-0 text-right">
                                                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => handleDeleteUnlock(unlock)}
                                                        className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                                        title="마감 해제 취소"
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

                    {/* 하단 Total */}
                    <div className="bg-muted/30 px-4 py-3 border-t border-border/20 flex items-center min-h-[48px]">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            TOTAL : <span className="text-primary ml-1">{unlocks.length}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* 마감 해제 추가 패널 */}
            <DraggablePanel
                open={isPanelOpen}
                onOpenChange={setIsPanelOpen}
                triggerRect={triggerRect}
                title="마감 해제 추가"
                description="특정 월의 마감을 해제하여 소급 입력을 허용합니다."
                className="max-w-md"
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-500">연도 <span className="text-primary">*</span></label>
                            <Dropdown
                                value={addForm.target_year.toString()}
                                onChange={val => setAddForm(prev => ({ ...prev, target_year: Number(val) }))}
                                options={YEAR_OPTIONS}
                                variant="premium"
                                align="center"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-500">월 <span className="text-primary">*</span></label>
                            <Dropdown
                                value={addForm.target_month}
                                onChange={val => setAddForm(prev => ({ ...prev, target_month: Number(val) }))}
                                options={MONTHS}
                                variant="premium"
                                align="center"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-500">해제 사유</label>
                        <textarea
                            value={addForm.reason}
                            onChange={e => setAddForm(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="예: 시스템 오류로 인한 소급 입력 허용"
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none resize-none"
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-sm font-bold text-amber-700">
                            ⚠️ {addForm.target_year}년 {addForm.target_month}월 작업일지를 마감 이후에도 입력/수정 가능하도록 허용합니다.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setIsPanelOpen(false)} className="font-bold text-slate-500">취소</Button>
                        <Button variant="primary" onClick={handleAddUnlock} className="px-10 min-w-[140px] h-11">
                            마감 해제 적용
                        </Button>
                    </div>
                </div>
            </DraggablePanel>
        </div>
    );
}
