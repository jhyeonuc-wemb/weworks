"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Building2,
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Edit,
    Save,
    X,
    GripVertical,
    FolderKanban,
    Search,
    User as UserIcon,
    Check
} from "lucide-react";

interface Department {
    id: number;
    name: string;
    parent_department_id: number | null;
    manager_id: number | null;
    manager_name?: string;
    manager_email?: string;
    description: string | null;
    display_order: number;
    children?: Department[];
}

interface User {
    id: number;
    name: string;
    email: string;
    position?: string;
    department_name?: string;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [dragOverInfo, setDragOverInfo] = useState<{ id: number; position: "before" | "after" | "inside" } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Manager Search States
    const [managerSearch, setManagerSearch] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        parent_department_id: "" as string | number,
        manager_id: "" as string | number,
        description: "",
    });

    useEffect(() => {
        fetchData();
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, userRes] = await Promise.all([
                fetch("/api/departments"),
                fetch("/api/users"),
            ]);
            const deptData = await deptRes.json();
            const userData = await userRes.json();

            const allUsers = userData.users || [];
            setUsers(allUsers);

            const normalized = (deptData.departments || []).map((d: any) => {
                const manager = allUsers.find((u: any) => Number(u.id) === Number(d.manager_id));
                return {
                    ...d,
                    id: Number(d.id),
                    parent_department_id: d.parent_department_id !== null ? Number(d.parent_department_id) : null,
                    manager_id: d.manager_id !== null ? Number(d.manager_id) : null,
                    manager_name: manager ? manager.name : undefined,
                    manager_email: manager ? manager.email : undefined,
                    display_order: typeof d.display_order === "number" ? d.display_order : 0
                };
            });

            setDepartments(normalized);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const departmentTree = useMemo(() => {
        const map = new Map<number, Department>();
        const roots: Department[] = [];
        departments.forEach((dept) => map.set(dept.id, { ...dept, children: [] }));
        departments.forEach((dept) => {
            const node = map.get(dept.id)!;
            if (dept.parent_department_id !== null && map.has(dept.parent_department_id)) {
                map.get(dept.parent_department_id)!.children!.push(node);
            } else {
                roots.push(node);
            }
        });
        const sortNodes = (nodes: Department[]) => {
            nodes.sort((a, b) => {
                if (a.display_order !== b.display_order) return a.display_order - b.display_order;
                if (a.name !== b.name) return a.name.localeCompare(b.name);
                return a.id - b.id;
            });
            nodes.forEach(n => { if (n.children && n.children.length > 0) sortNodes(n.children); });
        };
        sortNodes(roots);
        return roots;
    }, [departments]);

    // Robust searching: If search term matches selected user's formatted string, ignore filtering
    const filteredUsers = useMemo(() => {
        const term = managerSearch.trim().toLowerCase();

        // Find current selected user
        const selectedUser = users.find(u => Number(u.id) === Number(formData.manager_id));
        const selectedStr = selectedUser ? `${selectedUser.name} (${selectedUser.email})`.toLowerCase() : "";

        // If nothing typed or typing matches the current selection exactly, show initial set
        if (!term || term === selectedStr) return users.slice(0, 10);

        return users.filter(u =>
            (u.name || "").toLowerCase().includes(term) ||
            (u.email || "").toLowerCase().includes(term)
        ).slice(0, 10);
    }, [users, managerSearch, formData.manager_id]);

    const handleSelect = (dept: Department) => {
        setSelectedDeptId(dept.id);
        setIsEditMode(false);
        setIsAdding(false);
        setFormData({
            name: dept.name,
            parent_department_id: dept.parent_department_id ?? "",
            manager_id: dept.manager_id ?? "",
            description: dept.description ?? "",
        });
        setManagerSearch(dept.manager_name ? `${dept.manager_name} (${dept.manager_email})` : "");
    };

    const handleStartAdd = (parentId: number | null = null) => {
        setSelectedDeptId(null);
        setIsAdding(true);
        setIsEditMode(true);
        setFormData({
            name: "",
            parent_department_id: parentId ?? "",
            manager_id: "",
            description: "",
        });
        setManagerSearch("");
    };

    const handleUserSelect = (user: User | null) => {
        if (user) {
            setFormData(prev => ({ ...prev, manager_id: user.id }));
            setManagerSearch(`${user.name} (${user.email})`);
        } else {
            setFormData(prev => ({ ...prev, manager_id: "" }));
            setManagerSearch("");
        }
        setShowUserDropdown(false);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.name.trim()) return alert("부서명을 입력하세요.");

        try {
            const method = isAdding ? "POST" : "PATCH";
            const url = isAdding ? "/api/departments" : `/api/departments/${selectedDeptId}`;

            let display_order = 0;
            if (isAdding) {
                const parentId = formData.parent_department_id === "" ? null : Number(formData.parent_department_id);
                const siblings = departments.filter(d => d.parent_department_id === parentId);
                display_order = siblings.length > 0 ? Math.max(...siblings.map(s => s.display_order)) + 1000 : 1000;
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    parent_department_id: formData.parent_department_id === "" ? null : Number(formData.parent_department_id),
                    manager_id: formData.manager_id === "" ? null : Number(formData.manager_id),
                    ...(isAdding ? { display_order } : {})
                }),
            });

            if (response.ok) {
                await fetchData();
                setIsEditMode(false);
                setIsAdding(false);
                if (isAdding) setSelectedDeptId(null);
            } else {
                const err = await response.json();
                alert(`저장 실패: ${err.error || "알 수 없는 오류"}`);
            }
        } catch (error) {
            console.error("Error saving:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("부서를 삭제하시겠습니까? 하위 부서가 있는 경우 삭제되지 않습니다.")) return;
        try {
            const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
            if (res.ok) { await fetchData(); setSelectedDeptId(null); }
            else { const err = await res.json(); alert(err.error || "삭제 실패"); }
        } catch (error) { console.error("Delete error:", error); }
    };

    const handleDragStart = (e: React.DragEvent, id: number) => {
        const target = e.currentTarget as HTMLElement;
        e.dataTransfer.setData("text/plain", id.toString());
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
        setTimeout(() => { if (target) target.style.opacity = "0.3"; }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        (e.currentTarget as HTMLElement).style.opacity = "1";
        setDragOverInfo(null);
    };

    const handleDragOver = (e: React.DragEvent, targetId: number) => {
        e.preventDefault(); e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;
        let position: "before" | "after" | "inside";
        if (y < h * 0.25) position = "before";
        else if (y > h * 0.75) position = "after";
        else position = "inside";
        if (!dragOverInfo || dragOverInfo.id !== targetId || dragOverInfo.position !== position) {
            setDragOverInfo({ id: targetId, position });
        }
    };

    const handleDrop = async (e: React.DragEvent, targetId: number | null) => {
        e.preventDefault(); e.stopPropagation();
        const sourceId = Number(e.dataTransfer.getData("text/plain"));
        const pos = dragOverInfo?.position || "after";
        setIsDragging(false); setDragOverInfo(null);
        if (isNaN(sourceId)) return;
        if (sourceId === targetId && pos === "inside") return;

        const isDescendant = (pId: number, cId: number): boolean => {
            const dp = departments.find(d => d.id === cId);
            if (!dp || dp.parent_department_id === null) return false;
            if (dp.parent_department_id === pId) return true;
            return isDescendant(pId, dp.parent_department_id);
        };

        if (targetId !== null && (sourceId === targetId || isDescendant(sourceId, targetId))) {
            if (pos === "inside") { alert("상위 부서를 하위 부서로 이동할 수 없습니다."); return; }
        }

        let nextParentId: number | null = null;
        let nextOrder = 0;

        if (targetId === null) {
            nextParentId = null;
            const roots = departments.filter(d => d.parent_department_id === null && d.id !== sourceId).sort((a, b) => a.display_order - b.display_order);
            nextOrder = roots.length > 0 ? roots[roots.length - 1].display_order + 1000 : 1000;
        } else {
            const targetDept = departments.find(d => d.id === targetId)!;
            if (pos === "inside") {
                nextParentId = targetId;
                const children = departments.filter(d => d.parent_department_id === targetId && d.id !== sourceId).sort((a, b) => a.display_order - b.display_order);
                nextOrder = children.length > 0 ? children[children.length - 1].display_order + 1000 : 1000;
            } else {
                nextParentId = targetDept.parent_department_id;
                const siblings = departments.filter(d => d.parent_department_id === nextParentId && d.id !== sourceId).sort((a, b) => {
                    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
                    return a.name.localeCompare(b.name);
                });
                const idx = siblings.findIndex(s => s.id === targetId);
                if (pos === "before") {
                    const prev = siblings[idx - 1];
                    nextOrder = prev ? (prev.display_order + targetDept.display_order) / 2 : targetDept.display_order - 1000;
                } else {
                    const next = siblings[idx + 1];
                    nextOrder = next ? (targetDept.display_order + next.display_order) / 2 : targetDept.display_order + 1000;
                }
            }
        }

        try {
            const res = await fetch(`/api/departments/${sourceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parent_department_id: nextParentId, display_order: nextOrder }),
            });
            if (res.ok) { await fetchData(); if (nextParentId) setExpandedIds(prev => new Set(prev).add(nextParentId!)); }
        } catch (error) { console.error(error); }
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const renderNode = (dept: Department, level = 0) => {
        const isExpanded = expandedIds.has(dept.id);
        const isSelected = selectedDeptId === dept.id;
        const dragInfo = dragOverInfo?.id === dept.id ? dragOverInfo : null;

        return (
            <div key={dept.id} className="relative select-none">
                {dragInfo?.position === "before" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, dept.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, dept.id)}
                    onDrop={(e) => handleDrop(e, dept.id)}
                    onClick={() => handleSelect(dept)}
                    className={`group flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border ${isSelected
                        ? "bg-primary text-white shadow-lg shadow-primary/20 border-transparent"
                        : "bg-white/50 border-white hover:border-primary/30 hover:bg-white hover:shadow-md"
                        } ${dragInfo?.position === "inside" ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    <div className={`flex items-center gap-2 overflow-hidden ${isDragging ? "pointer-events-none" : ""}`}>
                        <GripVertical size={14} className={`${isSelected ? "text-white/50" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                        {(dept.children?.length ?? 0) > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(dept.id); }} className={`p-1 rounded-lg shrink-0 transition-colors ${isSelected ? "hover:bg-white/20" : "hover:bg-secondary"}`}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : <div className="w-6 shrink-0" />}
                        <Building2 size={16} className={isSelected ? "text-white/70" : "text-primary/70"} />
                        <span className="text-sm font-semibold truncate tracking-tight">{dept.name}</span>
                    </div>
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${isDragging ? "pointer-events-none" : ""}`}>
                        <button onClick={(e) => { e.stopPropagation(); handleStartAdd(dept.id); }} className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-white/20" : "hover:bg-secondary text-muted-foreground hover:text-primary"}`} title="하위 부서 추가"><Plus size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSelect(dept); setIsEditMode(true); }} className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-white/20" : "hover:bg-secondary text-muted-foreground hover:text-amber-500"}`} title="수정"><Edit size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }} className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-white/20" : "hover:bg-secondary text-muted-foreground hover:text-destructive"}`} title="삭제"><Trash2 size={14} /></button>
                    </div>
                </div>
                {dragInfo?.position === "after" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                {isExpanded && dept.children && <div className="mt-1 flex flex-col gap-1">{dept.children.map(child => renderNode(child, level + 1))}</div>}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            부서 관리
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            조직의 부서 및 팀 구조를 관리합니다.
                        </p>
                    </div>
                    <button
                        onClick={() => handleStartAdd()}
                        className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={16} />
                        <span>부서 추가</span>
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="flex flex-col md:flex-row h-[calc(100vh-16rem)] gap-6">
                {/* Explorer Sidebar */}
                <aside
                    className="w-full md:w-[400px] flex flex-col neo-light-card overflow-hidden border border-border/40"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <div className="px-8 py-6 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">부서 탐색기</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-primary/70 uppercase">조직도</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-main bg-white/40">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-3 border-primary/10 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">조직도를 불러오고 있습니다...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {departmentTree.length > 0 ? (
                                    departmentTree.map(node => renderNode(node))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                        <Building2 size={40} className="text-muted-foreground" />
                                        <p className="text-xs font-bold uppercase tracking-widest">부서 정보가 없습니다</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Detail Viewport */}
                <main className="flex-1 flex flex-col neo-light-card overflow-hidden border border-border/40 relative">
                    {selectedDeptId || isAdding ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar-main bg-white/60">
                            <form onSubmit={handleSave} className="p-12 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Form Identity Header */}
                                <div className="flex items-center gap-8 border-b border-border/20 pb-10">
                                    <div className={`w-20 h-20 rounded-[2.25rem] flex items-center justify-center border shadow-sm transition-all duration-500 ${isAdding
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-600 rotate-12"
                                        : "bg-primary/5 border-primary/20 text-primary"}`}>
                                        <Building2 size={36} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isAdding ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                                                {isAdding ? '신규 등록' : '정보 수정'}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest border-l border-border/40 pl-3">
                                                ID: {selectedDeptId || "PENDING"}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-black text-foreground tracking-tight italic">
                                            {isAdding ? "새 부서 프로토타입" : isEditMode ? "부서 속성 개정" : "시스템 노드 열람"}
                                        </h2>
                                    </div>
                                    {!isAdding && !isEditMode && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditMode(true)}
                                            className="px-6 py-3 rounded-2xl bg-white border border-border/60 hover:border-primary/40 hover:text-primary text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:translate-y-[-2px]"
                                        >
                                            수정하기
                                        </button>
                                    )}
                                </div>

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="md:col-span-2 space-y-2.5 group">
                                        <label className="text-xs font-bold text-slate-700 ml-1">부서명</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditMode && !isAdding}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-muted/10 border border-border/20 rounded-2xl px-6 py-4 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 disabled:opacity-60"
                                            placeholder="부서 명칭을 입력하세요..."
                                        />
                                    </div>

                                    <div className="space-y-2.5 group">
                                        <label className="text-xs font-bold text-slate-700 ml-1">상위 부서</label>
                                        <div className="relative">
                                            <select
                                                disabled={!isEditMode && !isAdding}
                                                value={formData.parent_department_id}
                                                onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
                                                className="w-full bg-muted/10 border border-border/20 rounded-2xl px-6 py-4 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none appearance-none transition-all duration-300 disabled:opacity-60"
                                            >
                                                <option value="">(최상위 루트)</option>
                                                {departments.filter(d => d.id !== selectedDeptId).map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-40" />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 group relative" ref={dropdownRef}>
                                        <label className="text-xs font-bold text-slate-700 ml-1">부서장 (관리자)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                disabled={!isEditMode && !isAdding}
                                                value={managerSearch}
                                                onChange={(e) => {
                                                    setManagerSearch(e.target.value);
                                                    setShowUserDropdown(true);
                                                }}
                                                onFocus={() => setShowUserDropdown(true)}
                                                placeholder="담당자 검색..."
                                                className="w-full bg-muted/10 border border-border/20 rounded-2xl px-12 py-4 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 disabled:opacity-60"
                                            />
                                            <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" />
                                            {managerSearch && (isEditMode || isAdding) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUserSelect(null)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {showUserDropdown && (isEditMode || isAdding) && (
                                            <div className="absolute z-50 left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/40 overflow-hidden py-3 animate-in fade-in zoom-in-95 duration-300">
                                                <div className="px-6 py-2 border-b border-border/10 mb-2">
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">사용자 선택</span>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar-main">
                                                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => handleUserSelect(user)}
                                                            className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-primary/5 transition-all text-left ${Number(formData.manager_id) === Number(user.id) ? "bg-primary/5" : ""}`}
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/20">
                                                                <UserIcon size={16} />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                                                                    {user.position && (
                                                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">
                                                                            {user.position}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground font-semibold truncate mt-0.5 opacity-60">{user.email}</p>
                                                            </div>
                                                            {Number(formData.manager_id) === Number(user.id) && <Check size={16} className="text-primary" />}
                                                        </button>
                                                    )) : (
                                                        <div className="px-6 py-8 text-center flex flex-col items-center gap-3 opacity-20">
                                                            <Search size={24} className="text-muted-foreground" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest italic">검색 결과가 없습니다</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-2.5 group">
                                        <label className="text-xs font-bold text-slate-700 ml-1">부서 설명</label>
                                        <textarea
                                            rows={5}
                                            disabled={!isEditMode && !isAdding}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-muted/10 border border-border/20 rounded-2xl px-6 py-5 text-sm font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none resize-none transition-all duration-300 disabled:opacity-60"
                                            placeholder="부서의 역할과 기여도를 명시하십시오..."
                                        />
                                    </div>
                                </div>

                                {/* Form Footer Actions */}
                                {(isEditMode || isAdding) && (
                                    <div className="flex gap-4 pt-10 border-t border-border/10">
                                        <button
                                            type="button"
                                            onClick={() => { if (isAdding) { setIsAdding(false); setSelectedDeptId(null); } else setIsEditMode(false); }}
                                            className="flex-1 px-8 py-4 rounded-2xl border border-border/40 text-muted-foreground font-bold text-sm tracking-widest hover:bg-muted transition-all active:scale-[0.98]"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 rounded-2xl bg-primary text-white font-bold text-sm tracking-[0.2em] hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                                        >
                                            저장
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center select-none animate-in fade-in zoom-in-95 duration-1000 bg-muted/10">
                            <div className="w-80 h-80 bg-white rounded-[3.5rem] flex items-center justify-center shadow-xl border border-white/60 mb-12 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 animate-pulse group-hover:bg-primary/10 transition-colors" />
                                <FolderKanban size={120} className="text-primary/10 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground/40 tracking-tight">
                                부서가 선택되지 않았습니다
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground/30 mt-4 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                                왼쪽 탐색기에서 부서를 선택하여 정보를 확인하거나 수정할 수 있습니다.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

