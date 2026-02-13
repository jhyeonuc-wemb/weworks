"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    Check,
    FolderOpen,
    Users as UsersIcon,
} from "lucide-react";
import {
    Button,
    Dropdown,
    SearchInput,
    DraggablePanel,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from "@/components/ui";

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
    rank_name?: string;
    rank_order?: number;
    title?: string | null;
    department_id: number | null;
    department_name?: string;
    employee_number?: string | null;
    phone?: string | null;
}

function DepartmentsContent() {
    const searchParams = useSearchParams();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [dragOverInfo, setDragOverInfo] = useState<{ id: number; position: "before" | "after" | "inside" } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Manager Search States
    const [managerSearch, setManagerSearch] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
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

            // 1레벨(최상위) 부서들을 기본적으로 펼침 상태로 설정
            const rootIds = normalized
                .filter((d: any) => d.parent_department_id === null)
                .map((d: any) => d.id);
            if (rootIds.length > 0) {
                setExpandedIds(new Set(rootIds));
            }
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

    // Handle deep search selection
    useEffect(() => {
        const deptId = searchParams.get('id');
        if (deptId && departments.length > 0) {
            const idNum = Number(deptId);
            const target = departments.find(d => d.id === idNum);
            if (target) {
                // Auto expand parents
                const newExpanded = new Set(expandedIds);
                let current: Department | undefined = target;
                while (current && current.parent_department_id) {
                    newExpanded.add(current.parent_department_id);
                    // eslint-disable-next-line no-loop-func
                    current = departments.find(d => d.id === current?.parent_department_id);
                }
                setExpandedIds(newExpanded);
                handleSelect(target);
            }
        }
    }, [searchParams, departments]);

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

    const getAllSubDeptIds = useCallback((deptId: number): number[] => {
        const ids = [deptId];
        const children = departments.filter(d => Number(d.parent_department_id) === deptId);
        children.sort((a, b) => {
            if (a.display_order !== b.display_order) return a.display_order - b.display_order;
            if (a.name !== b.name) return a.name.localeCompare(b.name);
            return a.id - b.id;
        });
        children.forEach(child => {
            ids.push(...getAllSubDeptIds(child.id));
        });
        return ids;
    }, [departments]);

    const deptMembers = useMemo(() => {
        if (!selectedDeptId) return [];
        const targetDeptIds = getAllSubDeptIds(selectedDeptId);
        const filtered = users.filter(u => u.department_id !== null && targetDeptIds.includes(Number(u.department_id)));

        return filtered.sort((a, b) => {
            // 1. 부서 순서 (조직도 계층 순서)
            const idxA = targetDeptIds.indexOf(Number(a.department_id));
            const idxB = targetDeptIds.indexOf(Number(b.department_id));
            if (idxA !== idxB) return idxA - idxB;

            // 2. 직책 (title) 이 있는 경우 우선
            const hasTitleA = a.title && a.title.trim() !== "" ? 0 : 1;
            const hasTitleB = b.title && b.title.trim() !== "" ? 0 : 1;
            if (hasTitleA !== hasTitleB) return hasTitleA - hasTitleB;

            // 3. 직급 순서 (rank_order)
            const orderA = a.rank_order ?? 999;
            const orderB = b.rank_order ?? 999;
            if (orderA !== orderB) return orderA - orderB;

            // 4. 직책 명칭 (title text)
            if (a.title && b.title && a.title !== b.title) return a.title.localeCompare(b.title);

            // 5. 이름 순
            return (a.name || "").localeCompare(b.name || "");
        });
    }, [users, selectedDeptId, departments]);

    const paginatedDeptMembers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return deptMembers.slice(startIndex, startIndex + itemsPerPage);
    }, [deptMembers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(deptMembers.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDeptId, itemsPerPage]);

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

    const handleStartAdd = (parentId: number | null = null, rect?: DOMRect) => {
        if (rect) setTriggerRect(rect);
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
        setIsModalOpen(true);
    };

    const handleEditStart = (dept: Department, rect?: DOMRect) => {
        if (rect) setTriggerRect(rect);
        setSelectedDeptId(dept.id);
        setIsAdding(false);
        setIsEditMode(true);
        setFormData({
            name: dept.name,
            parent_department_id: dept.parent_department_id ?? "",
            manager_id: dept.manager_id ?? "",
            description: dept.description ?? "",
        });
        setManagerSearch(dept.manager_name ? `${dept.manager_name} (${dept.manager_email})` : "");
        setIsModalOpen(true);
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
                setIsModalOpen(false);
                if (isAdding) {
                    setSelectedDeptId(null);
                    alert("부서가 등록되었습니다.");
                } else {
                    alert("부서 정보가 수정되었습니다.");
                }
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
            if (res.ok) {
                await fetchData();
                setSelectedDeptId(null);
                alert("부서가 삭제되었습니다.");
            }
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
            <div key={dept.id} className="relative select-none group/node">
                {dragInfo?.position === "before" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, dept.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, dept.id)}
                    onDrop={(e) => handleDrop(e, dept.id)}
                    onClick={() => handleSelect(dept)}
                    className={`group flex items-center justify-between px-8 py-3 cursor-pointer transition-all duration-300 border-b border-border/5 ${isSelected
                        ? "bg-primary/5 text-primary border-primary/10"
                        : "bg-transparent border-transparent hover:bg-muted/30"
                        } ${dragInfo?.position === "inside" ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                >
                    <div
                        className={`flex items-center gap-2 overflow-hidden ${isDragging ? "pointer-events-none" : ""}`}
                        style={{ paddingLeft: `${level * 20}px` }}
                    >
                        <GripVertical size={14} className={`${isSelected ? "text-primary/50" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                        {(dept.children?.length ?? 0) > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(dept.id); }} className={`p-1 rounded-lg shrink-0 transition-colors ${isSelected ? "hover:bg-primary/10" : "hover:bg-secondary"}`}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : <div className="w-6 shrink-0" />}
                        <Building2 size={16} className={isSelected ? "text-primary/70" : "text-slate-400"} />
                        <span className={`text-sm tracking-tight ${isSelected ? "font-bold" : "font-medium text-slate-700"}`}>{dept.name}</span>
                    </div>
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${isDragging ? "pointer-events-none" : ""}`}>
                        <button onClick={(e) => { e.stopPropagation(); handleStartAdd(dept.id, e.currentTarget.getBoundingClientRect()); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90" title="하위 부서 추가"><Plus size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(dept, e.currentTarget.getBoundingClientRect()); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90" title="수정"><Edit size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(dept.id); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90" title="삭제"><Trash2 size={14} /></button>
                    </div>
                </div>
                {dragInfo?.position === "after" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                {isExpanded && dept.children && <div className="">{dept.children.map(child => renderNode(child, level + 1))}</div>}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        부서 관리
                    </h1>
                </div>
                <Button
                    onClick={(e) => handleStartAdd(null, e.currentTarget.getBoundingClientRect())}
                    variant="primary"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    부서
                </Button>
            </div>

            {/* Main Content Container */}
            <div className="flex flex-col md:flex-row h-[calc(100vh-16rem)] gap-6">
                {/* Explorer Sidebar */}
                <aside
                    className="w-full md:w-[450px] flex flex-col neo-light-card overflow-hidden border border-border/40 bg-white"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Building2 size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">조직도</h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Explorer</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar-main bg-white">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {departmentTree.length > 0 ? (
                                    departmentTree.map(node => renderNode(node))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center gap-4 opacity-40">
                                        <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">부서 정보가 없습니다</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{departments.length}</span></div>
                    </div>
                </aside>

                {/* Detail Viewport (Read Only Info) */}
                <main className="flex-1 flex flex-col neo-light-card overflow-hidden border border-border/40 bg-white relative">
                    {selectedDeptId ? (
                        (() => {
                            const dept = departments.find(d => d.id === selectedDeptId);
                            if (!dept) return null;
                            return (
                                <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Header */}
                                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <UsersIcon size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{dept.name} 부서원</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Members</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* table area */}
                                    <div className="flex-1 overflow-x-auto custom-scrollbar-main">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow>
                                                    <TableHead className="px-2 py-3 text-sm text-slate-900 text-center w-20 whitespace-nowrap">순서</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">부서</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">성명</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">직급</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">사번</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">이메일</TableHead>
                                                    <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">연락처</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border/10">
                                                {deptMembers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="py-24 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                                <UsersIcon size={40} className="text-muted-foreground/30" />
                                                                <div className="space-y-1">
                                                                    <p className="text-base font-medium text-foreground">소속된 부서원이 없습니다</p>
                                                                    <p className="text-sm text-muted-foreground">사용자 관리에서 해당 부서로 인원을 배정하세요</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    paginatedDeptMembers.map((member, index) => (
                                                        <TableRow key={`${member.id}-${index}`} className="hover:bg-primary/[0.02] transition-colors group">
                                                            <TableCell className="whitespace-nowrap px-8 py-4 text-sm text-slate-500 text-center font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4 text-sm text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                                                {member.department_name || "-"}
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4">
                                                                <button
                                                                    onClick={() => window.location.href = `/settings/users?search=${encodeURIComponent(member.name)}`}
                                                                    className="text-sm font-bold text-slate-900 hover:text-primary hover:underline transition-colors text-left"
                                                                    title="사용자 정보로 이동"
                                                                >
                                                                    {member.name}
                                                                </button>
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4">
                                                                <div className="text-sm text-slate-900">{member.rank_name || "-"}</div>
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4 text-center font-mono text-sm text-slate-600">
                                                                {member.employee_number || "-"}
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4 text-sm text-slate-600">
                                                                {member.email}
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap px-8 py-4 text-sm text-slate-600">
                                                                {member.phone || "-"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* table footer */}
                                    <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
                                        <div className="absolute left-8 flex items-center gap-6">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{deptMembers.length}</span></div>

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
                            );
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-24 gap-4 opacity-40 text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">부서가 선택되지 않았습니다</p>
                                <p className="text-sm text-muted-foreground">왼쪽 조직도에서 부서를 선택하여 부서원 목록을 확인하세요</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 부서 등록/수정 모달 */}
            <DraggablePanel
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                triggerRect={triggerRect}
                title={isAdding ? "신규 부서 등록" : "부서 정보 수정"}
                description="조직 체계의 부서 정보를 관리합니다."
                className="max-w-2xl"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">
                            부서명 <span className="text-primary">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="부서 명칭을 입력하세요"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">상위 부서</label>
                            <Dropdown
                                value={formData.parent_department_id?.toString() || ""}
                                onChange={(val) => setFormData({ ...formData, parent_department_id: val === "" ? "" : Number(val) })}
                                options={[
                                    { value: "", label: "(최상위 루트)" },
                                    ...departments.filter(d => d.id !== selectedDeptId).map(dept => ({
                                        value: dept.id.toString(),
                                        label: dept.name
                                    }))
                                ]}
                                variant="standard"
                                placeholder="상위 부서 선택"
                            />
                        </div>

                        <div className="space-y-1 relative" ref={dropdownRef}>
                            <label className="text-xs font-bold text-gray-500">부서장</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={managerSearch}
                                    onChange={(e) => {
                                        setManagerSearch(e.target.value);
                                        setShowUserDropdown(true);
                                    }}
                                    onFocus={() => setShowUserDropdown(true)}
                                    placeholder="사용자 검색..."
                                    className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" />
                                {managerSearch && (
                                    <button
                                        type="button"
                                        onClick={() => handleUserSelect(null)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {showUserDropdown && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar-main">
                                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleUserSelect(user)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all text-left ${Number(formData.manager_id) === Number(user.id) ? "bg-primary/5" : ""}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                                    <UserIcon size={14} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900 truncate">{user.name}</span>
                                                        {user.position && (
                                                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                                                {user.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground truncate opacity-60">{user.email}</p>
                                                </div>
                                                {Number(formData.manager_id) === Number(user.id) && <Check size={14} className="text-primary" />}
                                            </button>
                                        )) : (
                                            <div className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">결과 없음</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">부서 설명</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 resize-none"
                            placeholder="부서의 상세 역할이나 부가 정보를 입력하세요"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                        >
                            취소
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="px-8 min-w-[120px]"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            저장
                        </Button>
                    </div>
                </form>
            </DraggablePanel>
        </div>
    );
}

export default function DepartmentsPage() {
    return (
        <Suspense fallback={
            <div className="h-full flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <DepartmentsContent />
        </Suspense>
    );
}

