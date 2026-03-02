"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
    Plus, Edit, Trash2, ChevronRight, Save, Layers, Tag, Circle, ArrowRight,
} from "lucide-react";
import {
    Button, DraggablePanel, Dropdown, useToast,
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── 타입 정의 ───────────────────────────────────
interface PhaseGroup {
    id: number;
    code: string;
    name: string;
    color: string;
    display_order: number;
    is_active: boolean;
    description: string | null;
    phase_count: number;
}

interface Phase {
    id: number;
    code: string;
    name: string;
    group_id: number;
    path: string | null;
    display_order: number;
    is_active: boolean;
    description: string | null;
}

interface PhaseStatus {
    id: number;
    phase_id: number;
    code: string;
    name: string;
    color: string;
    display_order: number;
    is_active: boolean;
    description: string | null;
    usage_count: number;
}

// ─── 색상 맵 ────────────────────────────────────
const COLOR_OPTIONS = [
    { value: "blue", label: "파랑" },
    { value: "emerald", label: "초록" },
    { value: "purple", label: "보라" },
    { value: "orange", label: "주황" },
    { value: "gray", label: "회색" },
    { value: "red", label: "빨강" },
    { value: "amber", label: "노랑" },
    { value: "indigo", label: "남색" },
];

const colorClass: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const dotColor: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    gray: "bg-gray-400",
    red: "bg-red-500",
    amber: "bg-amber-400",
    indigo: "bg-indigo-500",
};

// ─── 색상 테마 맵 (진한 버전) ─────────────────────
// ─── 색상 테마 맵 (Neo-Modern 프리미엄 버전) ─────────────────────
const colorTheme: Record<string, { bg: string; border: string; text: string; dot: string; nodeBg: string; nodeBorder: string; nodeText: string; connLine: string; glow: string; inactiveBorder: string }> = {
    blue: { bg: "bg-blue-50/40", border: "border-blue-100", text: "text-blue-700", dot: "bg-blue-500", nodeBg: "bg-blue-600", nodeBorder: "border-blue-600", nodeText: "text-white", connLine: "bg-blue-100", glow: "shadow-[0_0_15px_rgba(37,99,235,0.3)]", inactiveBorder: "border-blue-300" },
    emerald: { bg: "bg-emerald-50/40", border: "border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", nodeBg: "bg-emerald-600", nodeBorder: "border-emerald-600", nodeText: "text-white", connLine: "bg-emerald-100", glow: "shadow-[0_0_15px_rgba(5,150,105,0.3)]", inactiveBorder: "border-emerald-300" },
    purple: { bg: "bg-purple-50/40", border: "border-purple-100", text: "text-purple-700", dot: "bg-purple-500", nodeBg: "bg-purple-600", nodeBorder: "border-purple-600", nodeText: "text-white", connLine: "bg-purple-100", glow: "shadow-[0_0_15px_rgba(147,51,234,0.3)]", inactiveBorder: "border-purple-300" },
    orange: { bg: "bg-orange-50/40", border: "border-orange-100", text: "text-orange-700", dot: "bg-orange-500", nodeBg: "bg-orange-600", nodeBorder: "border-orange-600", nodeText: "text-white", connLine: "bg-orange-100", glow: "shadow-[0_0_15px_rgba(234,88,12,0.3)]", inactiveBorder: "border-orange-300" },
    gray: { bg: "bg-gray-50/40", border: "border-gray-200", text: "text-gray-600", dot: "bg-gray-400", nodeBg: "bg-gray-500", nodeBorder: "border-gray-500", nodeText: "text-white", connLine: "bg-gray-200", glow: "shadow-[0_0_15px_rgba(107,114,128,0.2)]", inactiveBorder: "border-gray-300" },
    red: { bg: "bg-red-50/40", border: "border-red-100", text: "text-red-700", dot: "bg-red-500", nodeBg: "bg-red-600", nodeBorder: "border-red-600", nodeText: "text-white", connLine: "bg-red-100", glow: "shadow-[0_0_15px_rgba(220,38,38,0.3)]", inactiveBorder: "border-red-300" },
    amber: { bg: "bg-amber-50/40", border: "border-amber-100", text: "text-amber-700", dot: "bg-amber-400", nodeBg: "bg-amber-500", nodeBorder: "border-amber-500", nodeText: "text-white", connLine: "bg-amber-100", glow: "shadow-[0_0_15px_rgba(217,119,6,0.2)]", inactiveBorder: "border-amber-300" },
    indigo: { bg: "bg-indigo-50/40", border: "border-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", nodeBg: "bg-indigo-600", nodeBorder: "border-indigo-600", nodeText: "text-white", connLine: "bg-indigo-100", glow: "shadow-[0_0_15px_rgba(79,70,229,0.3)]", inactiveBorder: "border-indigo-300" },
};

// ─── 단계 타임라인 오버뷰 컴포넌트 ─────────────────
// ─── 단계 타임라인 오버뷰 컴포넌트 ─────────────────
function PhaseTimeline({
    groups,
    allPhases,
    selectedGroup,
    selectedPhase,
    onTimelineClick,
}: {
    groups: PhaseGroup[];
    allPhases: Phase[];
    selectedGroup: PhaseGroup | null;
    selectedPhase: Phase | null;
    onSelectGroup: (g: PhaseGroup) => void;
    onSelectPhase: (p: Phase) => void;
    onTimelineClick: (group: PhaseGroup, phase: Phase) => void;
}) {
    const grouped = groups.map((g) => ({
        group: g,
        phases: allPhases.filter((p) => p.group_id === g.id).sort((a, b) => a.display_order - b.display_order),
    })).filter(item => item.phases.length > 0);

    if (grouped.length === 0) return null;

    // 모든 단계를 순서대로 펼친 리스트 (앞뒤 선택 상태 확인용)
    const flatPhases = grouped.flatMap(g => g.phases);

    return (
        <div className="w-full neo-light-card border border-border/40 bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-black/[0.02]">
            <div className="overflow-x-auto custom-scrollbar-main">
                <div className="flex items-stretch min-w-max">
                    {grouped.map((item, gi) => {
                        const theme = colorTheme[item.group.color] || colorTheme.blue;
                        const isGroupSelected = selectedGroup?.id === item.group.id;

                        return (
                            <div
                                key={item.group.id}
                                className={cn(
                                    "py-8 flex flex-col items-stretch transition-all duration-300 relative",
                                    isGroupSelected ? theme.bg : "bg-slate-50/60 transition-colors hover:bg-slate-100/40" // 기본 상태: 깔끔한 미색 배경
                                )}
                                style={{ flex: item.phases.length }}
                            >
                                {/* 그룹 배지 레이블 - 선명한 디자인 */}
                                <div className="absolute top-4 left-0 right-0 flex items-center justify-center">
                                    <div className={cn(
                                        "flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 bg-white shadow-sm transition-all",
                                        theme.border, theme.text, "text-[13px] font-black tracking-tight"
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                                        {item.group.name}
                                    </div>
                                </div>

                                {/* 단계 트랙 - 슬롯 기반 배치 */}
                                <div className="mt-10 flex items-start w-full">
                                    {item.phases.map((phase, pi) => {
                                        const isSelected = selectedPhase?.id === phase.id;
                                        const isOverallFirst = gi === 0 && pi === 0;
                                        const isOverallLast = gi === grouped.length - 1 && pi === item.phases.length - 1;
                                        // 현재 노드의 전체 순번 확인
                                        const flatIdx = flatPhases.findIndex(p => p.id === phase.id);
                                        const isPrevSelected = flatIdx > 0 && flatPhases[flatIdx - 1].id === selectedPhase?.id;
                                        const isNextSelected = flatIdx < flatPhases.length - 1 && flatPhases[flatIdx + 1].id === selectedPhase?.id;

                                        return (
                                            <div key={phase.id} className="flex-1 flex flex-col items-center relative group/slot">
                                                {/* 배경 커넥터 라인 - 더 선명하게 */}
                                                <div className="absolute top-[27px] left-0 right-0 h-[3px] flex items-center">
                                                    <div className={cn(
                                                        "flex-1 h-full transition-colors",
                                                        isOverallFirst ? "bg-transparent" : "bg-slate-200"
                                                    )}>
                                                        {!isOverallFirst && (
                                                            <div className={cn(
                                                                "h-full w-full origin-right transition-transform duration-500 scale-x-0",
                                                                (isSelected || isPrevSelected) && "scale-x-100",
                                                                theme.dot
                                                            )} />
                                                        )}
                                                    </div>
                                                    <div className="w-14 shrink-0" />
                                                    <div className={cn(
                                                        "flex-1 h-full transition-colors",
                                                        isOverallLast ? "bg-transparent" : "bg-slate-200"
                                                    )}>
                                                        {!isOverallLast && (
                                                            <div className={cn(
                                                                "h-full w-full origin-left transition-transform duration-500 scale-x-0",
                                                                (isSelected || isNextSelected) && "scale-x-100",
                                                                theme.dot
                                                            )} />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 단계 노드 버튼 */}
                                                <button
                                                    onClick={() => onTimelineClick(item.group, phase)}
                                                    className="flex flex-col items-center gap-3 shrink-0 group/node relative z-10"
                                                >
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all duration-300",
                                                        isSelected
                                                            ? cn(theme.nodeBg, theme.nodeBorder, theme.nodeText, theme.glow, "scale-110")
                                                            : cn("bg-white text-slate-800 shadow-sm relative overflow-hidden group-hover/node:scale-105")
                                                    )}>
                                                        {/* 선명한 테두리 적용 */}
                                                        {!isSelected && (
                                                            <div className={cn(
                                                                "absolute inset-0 rounded-full border-2 opacity-100 transition-colors",
                                                                theme.inactiveBorder
                                                            )} />
                                                        )}
                                                        <span className="relative z-10">{phase.display_order}</span>
                                                    </div>

                                                    <span className={cn(
                                                        "text-[13px] font-bold transition-all duration-300 whitespace-nowrap px-2 text-center",
                                                        isSelected ? theme.text : "text-slate-700 group-hover/node:text-slate-900"
                                                    )}>
                                                        {phase.name}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── 메인 컴포넌트 ───────────────────────────────
export default function BusinessPhasesPage() {
    const { showToast, confirm } = useToast();

    // 데이터 상태
    const [groups, setGroups] = useState<PhaseGroup[]>([]);
    const [phases, setPhases] = useState<Phase[]>([]);
    const [allPhases, setAllPhases] = useState<Phase[]>([]);
    const [statuses, setStatuses] = useState<PhaseStatus[]>([]);

    // 선택 상태
    const [selectedGroup, setSelectedGroup] = useState<PhaseGroup | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

    // 로딩
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingPhases, setLoadingPhases] = useState(false);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    // 모달 상태
    const [groupModal, setGroupModal] = useState<{ open: boolean; edit: PhaseGroup | null; rect: DOMRect | null }>({ open: false, edit: null, rect: null });
    const [phaseModal, setPhaseModal] = useState<{ open: boolean; edit: Phase | null; rect: DOMRect | null }>({ open: false, edit: null, rect: null });
    const [statusModal, setStatusModal] = useState<{ open: boolean; edit: PhaseStatus | null; rect: DOMRect | null }>({ open: false, edit: null, rect: null });

    // 폼 데이터
    const [groupForm, setGroupForm] = useState({ code: "", name: "", color: "blue", display_order: "0", description: "" });
    const [phaseForm, setPhaseForm] = useState({ code: "", name: "", path: "", display_order: "0", is_active: true, description: "" });
    const [statusForm, setStatusForm] = useState({ code: "", name: "", color: "gray", display_order: "0", is_active: true, description: "" });

    // ─── 데이터 로드 ───
    const fetchGroups = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const [grpRes, phsRes] = await Promise.all([
                fetch("/api/settings/phase-groups"),
                fetch("/api/settings/phases"),
            ]);
            const grpData = await grpRes.json();
            const phsData = await phsRes.json();
            setGroups(grpData.groups || []);
            setAllPhases(phsData.phases || []);
        } finally {
            setLoadingGroups(false);
        }
    }, []);

    const fetchPhases = useCallback(async (groupId: number) => {
        setLoadingPhases(true);
        setSelectedPhase(null);
        setStatuses([]);
        try {
            const res = await fetch("/api/settings/phases");
            const data = await res.json();
            const filtered = (data.phases || []).filter((p: Phase) => p.group_id === groupId);
            setPhases(filtered);
        } finally {
            setLoadingPhases(false);
        }
    }, []);

    const fetchStatuses = useCallback(async (phaseId: number) => {
        setLoadingStatuses(true);
        try {
            const res = await fetch(`/api/settings/phase-statuses?phaseId=${phaseId}`);
            const data = await res.json();
            setStatuses(data.statuses || []);
        } finally {
            setLoadingStatuses(false);
        }
    }, []);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    const handleSelectGroup = (group: PhaseGroup) => {
        setSelectedGroup(group);
        fetchPhases(group.id);
    };

    const handleSelectPhase = (phase: Phase) => {
        setSelectedPhase(phase);
        fetchStatuses(phase.id);
    };

    // 타임라인 클릭: 그룹 전환 + 단계 선택을 한 번에
    const handleTimelineClick = useCallback((group: PhaseGroup, phase: Phase) => {
        setSelectedGroup(group);
        setSelectedPhase(phase);
        // 해당 그룹의 단계는 allPhases에서 직접 필터
        const groupPhases = allPhases.filter((p) => p.group_id === group.id);
        setPhases(groupPhases);
        fetchStatuses(phase.id);
    }, [allPhases, fetchStatuses]);

    // ─── 그룹 CRUD ───
    const openGroupAdd = (e: React.MouseEvent) => {
        setGroupForm({ code: "", name: "", color: "blue", display_order: String(groups.length + 1), description: "" });
        setGroupModal({ open: true, edit: null, rect: e.currentTarget.getBoundingClientRect() });
    };
    const openGroupEdit = (g: PhaseGroup, e: React.MouseEvent) => {
        e.stopPropagation();
        setGroupForm({ code: g.code, name: g.name, color: g.color, display_order: String(g.display_order), description: g.description || "" });
        setGroupModal({ open: true, edit: g, rect: e.currentTarget.getBoundingClientRect() });
    };
    const saveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = !!groupModal.edit;
        const payload = { ...groupForm, display_order: parseInt(groupForm.display_order) || 0 };
        try {
            const res = await fetch("/api/settings/phase-groups", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? { id: groupModal.edit!.id, ...payload } : payload),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "저장 실패", "error"); return; }
            showToast(isEdit ? "그룹이 수정되었습니다." : "그룹이 추가되었습니다.", "success");
            setGroupModal(m => ({ ...m, open: false }));
            await fetchGroups();
        } catch { showToast("저장에 실패했습니다.", "error"); }
    };
    const deleteGroup = async (g: PhaseGroup, e: React.MouseEvent) => {
        e.stopPropagation();
        confirm({
            message: `'${g.name}' 그룹을 삭제하시겠습니까? (단계가 없는 경우에만 삭제 가능)`,
            title: "그룹 삭제",
            onConfirm: async () => {
                const res = await fetch(`/api/settings/phase-groups?id=${g.id}`, { method: "DELETE" });
                const data = await res.json();
                if (!res.ok) { showToast(data.error || "삭제 실패", "error"); return; }
                showToast("그룹이 삭제되었습니다.", "success");
                if (selectedGroup?.id === g.id) { setSelectedGroup(null); setPhases([]); setStatuses([]); }
                await fetchGroups();
            },
        });
    };

    // ─── 단계 CRUD ───
    const openPhaseAdd = (e: React.MouseEvent) => {
        setPhaseForm({ code: "", name: "", path: "", display_order: String(phases.length + 1), is_active: true, description: "" });
        setPhaseModal({ open: true, edit: null, rect: e.currentTarget.getBoundingClientRect() });
    };
    const openPhaseEdit = (p: Phase, e: React.MouseEvent) => {
        e.stopPropagation();
        setPhaseForm({ code: p.code, name: p.name, path: p.path || "", display_order: String(p.display_order), is_active: p.is_active, description: p.description || "" });
        setPhaseModal({ open: true, edit: p, rect: e.currentTarget.getBoundingClientRect() });
    };
    const savePhase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;
        const isEdit = !!phaseModal.edit;
        const payload = { ...phaseForm, group_id: selectedGroup.id, phase_group: selectedGroup.code, display_order: parseInt(phaseForm.display_order) || 0 };
        try {
            const res = await fetch("/api/settings/phases", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? { id: phaseModal.edit!.id, ...payload } : payload),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "저장 실패", "error"); return; }
            showToast(isEdit ? "단계가 수정되었습니다." : "단계가 추가되었습니다.", "success");
            setPhaseModal(m => ({ ...m, open: false }));
            await fetchPhases(selectedGroup.id);
            await fetchGroups();
        } catch { showToast("저장에 실패했습니다.", "error"); }
    };
    const deletePhase = async (p: Phase, e: React.MouseEvent) => {
        e.stopPropagation();
        confirm({
            message: `'${p.name}' 단계를 삭제하시겠습니까? 프로젝트에 영향이 있을 수 있습니다.`,
            title: "단계 삭제",
            onConfirm: async () => {
                const res = await fetch(`/api/settings/phases?id=${p.id}`, { method: "DELETE" });
                const data = await res.json();
                if (!res.ok) { showToast(data.error || "삭제 실패", "error"); return; }
                showToast("단계가 삭제되었습니다.", "success");
                if (selectedPhase?.id === p.id) { setSelectedPhase(null); setStatuses([]); }
                if (selectedGroup) await fetchPhases(selectedGroup.id);
                await fetchGroups();
            },
        });
    };

    // ─── 상태 CRUD ───
    const openStatusAdd = (e: React.MouseEvent) => {
        setStatusForm({ code: "", name: "", color: "gray", display_order: String(statuses.length + 1), is_active: true, description: "" });
        setStatusModal({ open: true, edit: null, rect: e.currentTarget.getBoundingClientRect() });
    };
    const openStatusEdit = (s: PhaseStatus, e: React.MouseEvent) => {
        e.stopPropagation();
        setStatusForm({ code: s.code, name: s.name, color: s.color, display_order: String(s.display_order), is_active: s.is_active, description: s.description || "" });
        setStatusModal({ open: true, edit: s, rect: e.currentTarget.getBoundingClientRect() });
    };
    const saveStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPhase) return;
        const isEdit = !!statusModal.edit;
        const payload = { ...statusForm, phase_id: selectedPhase.id, display_order: parseInt(statusForm.display_order) || 0 };
        try {
            const res = await fetch("/api/settings/phase-statuses", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEdit ? { id: statusModal.edit!.id, ...payload } : payload),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || "저장 실패", "error"); return; }
            showToast(isEdit ? "상태가 수정되었습니다." : "상태가 추가되었습니다.", "success");
            setStatusModal(m => ({ ...m, open: false }));
            await fetchStatuses(selectedPhase.id);
        } catch { showToast("저장에 실패했습니다.", "error"); }
    };
    const deleteStatus = async (s: PhaseStatus, e: React.MouseEvent) => {
        e.stopPropagation();
        if (s.usage_count > 0) {
            showToast(`${s.usage_count}개 프로젝트에서 사용 중이므로 삭제할 수 없습니다.`, "error");
            return;
        }
        confirm({
            message: `'${s.name}' 상태를 삭제하시겠습니까?`,
            title: "상태 삭제",
            onConfirm: async () => {
                const res = await fetch(`/api/settings/phase-statuses?id=${s.id}`, { method: "DELETE" });
                const data = await res.json();
                if (!res.ok) { showToast(data.error || "삭제 실패", "error"); return; }
                showToast("상태가 삭제되었습니다.", "success");
                if (selectedPhase) await fetchStatuses(selectedPhase.id);
            },
        });
    };

    // ─── 렌더 ────────────────────────────────────
    return (
        <div className="space-y-8">
            {/* 페이지 헤더 */}
            <div className="flex items-start justify-between px-2">
                <div className="h-10 flex items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">사업 단계</h1>
                </div>
            </div>

            {/* ── 단계 타임라인 오버뷰 ── */}
            {!loadingGroups && groups.length > 0 && (
                <PhaseTimeline
                    groups={groups}
                    allPhases={allPhases}
                    selectedGroup={selectedGroup}
                    selectedPhase={selectedPhase}
                    onSelectGroup={handleSelectGroup}
                    onSelectPhase={handleSelectPhase}
                    onTimelineClick={handleTimelineClick}
                />
            )}

            {/* 3-패널 레이아웃 */}
            <div className="flex gap-5 items-start">

                {/* ── 좌측: 그룹 패널 ── */}
                <aside className="w-full md:w-[260px] shrink-0 neo-light-card overflow-hidden border border-border/40 bg-white sticky top-6 self-start">
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Layers size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">그룹</h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Groups</p>
                            </div>
                        </div>
                        <button
                            onClick={openGroupAdd}
                            className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm"
                            title="그룹 추가"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="p-2">
                        {loadingGroups ? (
                            <div className="py-12 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : groups.length === 0 ? (
                            <p className="py-8 text-center text-xs text-muted-foreground">그룹이 없습니다</p>
                        ) : (
                            groups.map((g) => {
                                const isSelected = selectedGroup?.id === g.id;
                                return (
                                    <div
                                        key={g.id}
                                        onClick={() => handleSelectGroup(g)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && handleSelectGroup(g)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 h-11 rounded-xl transition-all text-sm group relative overflow-hidden mb-1 cursor-pointer",
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-md shadow-slate-200 font-bold"
                                                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                isSelected ? "bg-white" : dotColor[g.color] || "bg-gray-400"
                                            )} />
                                            <span className="truncate">{g.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 relative z-10">
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
                                                <button
                                                    onClick={(e) => openGroupEdit(g, e)}
                                                    className={cn(
                                                        "p-1.5 rounded-2xl transition-all active:scale-90",
                                                        isSelected
                                                            ? "bg-white/20 text-white hover:bg-white/30"
                                                            : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                    )}
                                                    title="수정"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => deleteGroup(g, e)}
                                                    className={cn(
                                                        "p-1.5 rounded-2xl transition-all active:scale-90",
                                                        isSelected
                                                            ? "bg-white/20 text-white hover:bg-white/30"
                                                            : "bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    )}
                                                    title="삭제"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <ChevronRight className={cn(
                                                "h-3 w-3 shrink-0 transition-transform opacity-0 group-hover:opacity-100",
                                                isSelected ? "text-white" : "text-slate-400"
                                            )} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center min-h-[56px]">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{groups.length}</span></div>
                    </div>
                </aside>

                {/* ── 중간: 단계 패널 ── */}
                <div className="flex-1 neo-light-card overflow-hidden border border-border/40 bg-white self-start">
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center",
                                selectedGroup
                                    ? `${colorClass[selectedGroup.color] || "bg-blue-50 text-blue-700"} border`
                                    : "bg-primary/10 text-primary"
                            )}>
                                <Tag size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    {selectedGroup ? `${selectedGroup.name} 단계` : "그룹을 선택하세요"}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">
                                    Phases
                                </p>
                            </div>
                        </div>
                        {selectedGroup && (
                            <button
                                onClick={openPhaseAdd}
                                className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm"
                                title="단계 추가"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    {!selectedGroup ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 opacity-40 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <Layers className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">그룹이 선택되지 않았습니다</p>
                                <p className="text-sm text-muted-foreground">왼쪽 그룹 목록에서 그룹을 선택하세요</p>
                            </div>
                        </div>
                    ) : loadingPhases ? (
                        <div className="py-16 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="h-[46px] border-none">
                                        <TableHead className="px-8 py-0 w-14 text-center whitespace-nowrap">순서</TableHead>
                                        <TableHead className="px-4 py-0 w-40 whitespace-nowrap">코드</TableHead>
                                        <TableHead className="px-4 py-0 whitespace-nowrap">단계명</TableHead>
                                        <TableHead className="px-4 py-0 whitespace-nowrap">설명</TableHead>
                                        <TableHead className="px-8 py-0 w-20 text-center whitespace-nowrap">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {phases.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground border-none">
                                                이 그룹에 등록된 단계가 없습니다
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        phases.map((p) => {
                                            const isSelected = selectedPhase?.id === p.id;
                                            return (
                                                <TableRow
                                                    key={p.id}
                                                    onClick={() => handleSelectPhase(p)}
                                                    className={cn(
                                                        "h-[46px] cursor-pointer transition-colors group border-none",
                                                        isSelected
                                                            ? "bg-slate-900/[0.03] border-l-2 border-l-primary"
                                                            : "hover:bg-primary/[0.02]"
                                                    )}
                                                >
                                                    <TableCell className="text-center px-8 py-0">
                                                        <span className="text-sm text-muted-foreground">{p.display_order}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-0">
                                                        <span className="text-sm font-mono text-foreground/60">{p.code}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-0">
                                                        <span className={cn(
                                                            "text-sm",
                                                            isSelected ? "text-primary" : "text-foreground"
                                                        )}>{p.name}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-0 max-w-[200px]">
                                                        <span className="text-sm text-muted-foreground truncate block">{p.description || "—"}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center px-8 py-0 whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transition-transform">
                                                            <button
                                                                onClick={(e) => openPhaseEdit(p, e)}
                                                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                                title="수정"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => deletePhase(p, e)}
                                                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                                                title="삭제"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                            <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center min-h-[56px]">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{phases.length}</span></div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── 우측: 상태 패널 ── */}
                <aside className="w-full md:w-[300px] shrink-0 neo-light-card overflow-hidden border border-border/40 bg-white sticky top-6 self-start">
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Circle size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    {selectedPhase ? `${selectedPhase.name} 상태` : "단계를 선택하세요"}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">
                                    Statuses
                                </p>
                            </div>
                        </div>
                        {selectedPhase && (
                            <button
                                onClick={openStatusAdd}
                                className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm"
                                title="상태 추가"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    <div className="p-2">
                        {!selectedPhase ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 opacity-40 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
                                    <Circle className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-medium text-foreground">단계가 선택되지 않았습니다</p>
                                    <p className="text-sm text-muted-foreground">단계를 선택하면 상태 목록이 표시됩니다</p>
                                </div>
                            </div>
                        ) : loadingStatuses ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-slate-400">상태 로드 중...</p>
                            </div>
                        ) : statuses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-40 text-center">
                                <p className="text-base font-medium text-foreground">등록된 상태가 없습니다</p>
                                <p className="text-sm text-muted-foreground">상태 추가 버튼을 눌러 새 상태를 등록하세요</p>
                            </div>
                        ) : (
                            statuses.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between px-4 h-11 rounded-xl transition-all group hover:bg-slate-100/80 mb-1 cursor-default"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor[s.color] || "bg-gray-400")} />
                                        <span className="text-sm text-slate-800 truncate">{s.name}</span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all shrink-0">
                                        <button
                                            onClick={(e) => openStatusEdit(s, e)}
                                            className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                            title="수정"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => deleteStatus(s, e)}
                                            className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                            title="삭제"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedPhase && !loadingStatuses && (
                        <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center min-h-[56px]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{statuses.length}</span></div>
                        </div>
                    )}
                </aside>
            </div>

            {/* ── 그룹 추가/수정 모달 ── */}
            <DraggablePanel
                open={groupModal.open}
                onOpenChange={(v) => setGroupModal(m => ({ ...m, open: v }))}
                triggerRect={groupModal.rect}
                title={groupModal.edit ? "그룹 수정" : "그룹 추가"}
                description="사업단계 그룹을 정의합니다."
                className="max-w-sm"
            >
                <form onSubmit={saveGroup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">코드 <span className="text-primary">*</span></label>
                            <input
                                type="text"
                                value={groupForm.code}
                                disabled={!!groupModal.edit}
                                onChange={(e) => setGroupForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="예: sales_ps"
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all disabled:bg-muted/30 disabled:text-muted-foreground/60"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">표시 순서</label>
                            <input
                                type="number"
                                value={groupForm.display_order}
                                onChange={(e) => setGroupForm(f => ({ ...f, display_order: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">그룹명 <span className="text-primary">*</span></label>
                        <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="화면에 표시될 이름"
                            className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">색상</label>
                        <Dropdown
                            value={groupForm.color}
                            onChange={(v) => setGroupForm(f => ({ ...f, color: v as string }))}
                            options={COLOR_OPTIONS}
                            placeholder="색상 선택"
                            variant="standard"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" type="button" onClick={() => setGroupModal(m => ({ ...m, open: false }))}>취소</Button>
                        <Button className="min-w-[100px]"><Save className="h-4 w-4 mr-1.5" />저장</Button>
                    </div>
                </form>
            </DraggablePanel>

            {/* ── 단계 추가/수정 모달 ── */}
            <DraggablePanel
                open={phaseModal.open}
                onOpenChange={(v) => setPhaseModal(m => ({ ...m, open: v }))}
                triggerRect={phaseModal.rect}
                title={phaseModal.edit ? "단계 수정" : "단계 추가"}
                description={selectedGroup ? `${selectedGroup.name} 그룹의 단계를 정의합니다.` : ""}
                className="max-w-md"
            >
                <form onSubmit={savePhase} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">코드 <span className="text-primary">*</span></label>
                            <input
                                type="text"
                                value={phaseForm.code}
                                disabled={!!phaseModal.edit}
                                onChange={(e) => setPhaseForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="예: lead"
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all disabled:bg-muted/30"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">표시 순서</label>
                            <input
                                type="number"
                                value={phaseForm.display_order}
                                onChange={(e) => setPhaseForm(f => ({ ...f, display_order: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">단계명 <span className="text-primary">*</span></label>
                        <input
                            type="text"
                            value={phaseForm.name}
                            onChange={(e) => setPhaseForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="화면에 표시될 이름"
                            className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">경로 (Path)</label>
                        <input
                            type="text"
                            value={phaseForm.path}
                            onChange={(e) => setPhaseForm(f => ({ ...f, path: e.target.value }))}
                            placeholder="예: /md-estimation"
                            className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">설명</label>
                        <textarea
                            value={phaseForm.description ?? ''}
                            onChange={(e) => setPhaseForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="단계에 대한 간단한 설명"
                            rows={2}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" type="button" onClick={() => setPhaseModal(m => ({ ...m, open: false }))}>취소</Button>
                        <Button className="min-w-[100px]"><Save className="h-4 w-4 mr-1.5" />저장</Button>
                    </div>
                </form>
            </DraggablePanel>

            {/* ── 상태 추가/수정 모달 ── */}
            <DraggablePanel
                open={statusModal.open}
                onOpenChange={(v) => setStatusModal(m => ({ ...m, open: v }))}
                triggerRect={statusModal.rect}
                title={statusModal.edit ? "상태 수정" : "상태 추가"}
                description={selectedPhase ? `'${selectedPhase.name}' 단계의 진행 상태를 정의합니다.` : ""}
                className="max-w-sm"
            >
                <form onSubmit={saveStatus} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">코드 <span className="text-primary">*</span></label>
                            <input
                                type="text"
                                value={statusForm.code}
                                disabled={!!statusModal.edit}
                                onChange={(e) => setStatusForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="예: STANDBY"
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all disabled:bg-muted/30"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">표시 순서</label>
                            <input
                                type="number"
                                value={statusForm.display_order}
                                onChange={(e) => setStatusForm(f => ({ ...f, display_order: e.target.value }))}
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">상태명 <span className="text-primary">*</span></label>
                        <input
                            type="text"
                            value={statusForm.name}
                            onChange={(e) => setStatusForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="화면에 표시될 이름"
                            className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">색상</label>
                        <Dropdown
                            value={statusForm.color}
                            onChange={(v) => setStatusForm(f => ({ ...f, color: v as string }))}
                            options={COLOR_OPTIONS}
                            placeholder="색상 선택"
                            variant="standard"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" type="button" onClick={() => setStatusModal(m => ({ ...m, open: false }))}>취소</Button>
                        <Button className="min-w-[100px]"><Save className="h-4 w-4 mr-1.5" />저장</Button>
                    </div>
                </form>
            </DraggablePanel>
        </div>
    );
}
