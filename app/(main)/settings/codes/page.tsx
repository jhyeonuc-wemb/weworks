"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Boxes,
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Edit,
    Save,
    X,
    GripVertical,
    FolderTree,
    Search,
    Code as CodeIcon,
    Check,
    FolderOpen,
    LayoutGrid,
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
import { cn } from "@/lib/utils";

interface Code {
    id: number;
    parent_id: number | null;
    code: string;
    name: string;
    description: string | null;
    display_order: number;
    is_active: boolean;
    is_system: boolean;
    children?: Code[];
}

function CodesContent() {
    const searchParams = useSearchParams();
    const [codes, setCodes] = useState<Code[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [dragOverInfo, setDragOverInfo] = useState<{ id: number; position: "before" | "after" | "inside" } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        parent_id: "" as string | number,
        description: "",
        display_order: 0,
        is_active: true,
    });
    const [treeSearch, setTreeSearch] = useState("");

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/codes?includeInactive=true");
            const data = await res.json();
            const normalized = (data.codes || []).map((c: any) => ({
                ...c,
                id: Number(c.id),
                parent_id: c.parent_id !== null ? Number(c.parent_id) : null,
                display_order: Number(c.display_order || 0)
            }));
            setCodes(normalized);

            // Expand root levels by default
            const rootIds = normalized
                .filter((c: any) => c.parent_id === null)
                .map((c: any) => c.id);
            if (rootIds.length > 0) {
                setExpandedIds(new Set(rootIds));
            }
        } catch (error) {
            console.error("Error fetching codes:", error);
        } finally {
            setLoading(false);
        }
    };

    const codeTree = useMemo(() => {
        const map = new Map<number, Code>();
        const roots: Code[] = [];
        codes.forEach((c) => map.set(c.id, { ...c, children: [] }));
        codes.forEach((c) => {
            const node = map.get(c.id)!;
            if (c.parent_id !== null && map.has(c.parent_id)) {
                map.get(c.parent_id)!.children!.push(node);
            } else {
                roots.push(node);
            }
        });
        const sortNodes = (nodes: Code[]) => {
            nodes.sort((a, b) => {
                if (a.display_order !== b.display_order) return a.display_order - b.display_order;
                return a.name.localeCompare(b.name);
            });
            nodes.forEach(n => { if (n.children && n.children.length > 0) sortNodes(n.children); });
        };
        sortNodes(roots);
        return roots;
    }, [codes]);

    const filteredCodeTree = useMemo(() => {
        if (!treeSearch.trim()) return codeTree;
        const term = treeSearch.toLowerCase();
        const filterNodes = (nodes: Code[]): Code[] => {
            const result: Code[] = [];
            nodes.forEach(node => {
                const children = node.children ? filterNodes(node.children) : [];
                const matches = node.name.toLowerCase().includes(term) || node.code.toLowerCase().includes(term);
                if (matches || children.length > 0) {
                    result.push({ ...node, children });
                }
            });
            return result;
        };
        return filterNodes(codeTree);
    }, [codeTree, treeSearch]);

    // Auto-expand on search
    useEffect(() => {
        if (treeSearch.trim()) {
            const matchingIds = new Set<number>();
            const addParents = (nodes: Code[]) => {
                let hasMatch = false;
                nodes.forEach(node => {
                    const childrenMatch = node.children ? addParents(node.children) : false;
                    const nodeMatches = node.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
                        node.code.toLowerCase().includes(treeSearch.toLowerCase());
                    if (childrenMatch || nodeMatches) {
                        if (node.children?.length) matchingIds.add(node.id);
                        hasMatch = true;
                    }
                });
                return hasMatch;
            };
            addParents(codeTree);
            setExpandedIds(prev => new Set([...Array.from(prev), ...Array.from(matchingIds)]));
        }
    }, [treeSearch, codeTree]);

    const hierarchicalOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [{ value: "", label: "(최상위 분류)" }];
        const flatten = (nodes: Code[], level: number) => {
            nodes.forEach(node => {
                if (!isAdding && node.id === editingId) return;
                const indent = "\u00A0\u00A0".repeat(level);
                const prefix = level > 0 ? "└ " : "";
                options.push({
                    value: node.id.toString(),
                    label: `${indent}${prefix}${node.name}`
                });
                if (node.children && node.children.length > 0) flatten(node.children, level + 1);
            });
        };
        flatten(codeTree, 0);
        return options;
    }, [codeTree, isAdding, editingId]);

    const handleSelect = (code: Code) => {
        setSelectedCodeId(code.id);
    };

    const generateSuggestedCode = (parentId: number | null) => {
        if (parentId === null) {
            // Root level: CD_001, CD_002...
            const roots = codes.filter(c => c.parent_id === null);
            const maxSeq = roots.reduce((max, c) => {
                const match = c.code.match(/^CD_(\d+)$/);
                return match ? Math.max(max, parseInt(match[1])) : max;
            }, 0);
            return `CD_${(maxSeq + 1).toString().padStart(3, '0')}`;
        } else {
            // Sub level: PARENT_01, PARENT_02...
            const parent = codes.find(c => c.id === parentId);
            if (!parent) return "";
            const children = codes.filter(c => c.parent_id === parentId);
            const maxSeq = children.reduce((max, c) => {
                const prefix = `${parent.code}_`;
                if (c.code.startsWith(prefix)) {
                    const suffix = c.code.replace(prefix, "");
                    const num = parseInt(suffix);
                    return !isNaN(num) ? Math.max(max, num) : max;
                }
                return max;
            }, 0);
            return `${parent.code}_${(maxSeq + 1).toString().padStart(2, '0')}`;
        }
    };

    const handleStartAdd = (parentId: number | null = null, rect?: DOMRect) => {
        if (rect) setTriggerRect(rect);
        setIsAdding(true);
        setEditingId(null);
        const suggested = generateSuggestedCode(parentId);

        // Calculate next display order
        const siblings = codes.filter(c => c.parent_id === parentId);
        const nextOrder = siblings.length > 0
            ? Math.max(...siblings.map(c => c.display_order)) + 1
            : 1;

        setFormData({
            code: suggested,
            name: "",
            parent_id: parentId ?? "",
            description: "",
            display_order: nextOrder,
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const handleEditStart = (code: Code, rect?: DOMRect) => {
        if (rect) setTriggerRect(rect);
        setIsAdding(false);
        setEditingId(code.id);
        setFormData({
            code: code.code,
            name: code.name,
            parent_id: code.parent_id ?? "",
            description: code.description ?? "",
            display_order: code.display_order,
            is_active: code.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim()) return alert("코드와 코드명을 입력하세요.");

        try {
            const method = isAdding ? "POST" : "PUT";
            const url = isAdding ? "/api/codes" : `/api/codes/${editingId}`;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    parent_id: formData.parent_id === "" ? null : Number(formData.parent_id),
                }),
            });

            if (response.ok) {
                await fetchCodes();
                setIsModalOpen(false);
                alert(isAdding ? "코드가 등록되었습니다." : "코드 정보가 수정되었습니다.");
            } else {
                const err = await response.json();
                alert(`저장 실패: ${err.error || "알 수 없는 오류"}`);
            }
        } catch (error) {
            console.error("Error saving code:", error);
        }
    };

    const handleDelete = async (id: number) => {
        const target = codes.find(c => c.id === id);
        if (target?.is_system) return alert("시스템 코드는 삭제할 수 없습니다.");

        if (!confirm("코드를 삭제하시겠습니까? 하위 코드가 있는 경우 함께 삭제될 수 있습니다.")) return;

        try {
            const res = await fetch(`/api/codes/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchCodes();
                setSelectedCodeId(null);
                alert("코드가 삭제되었습니다.");
            } else {
                const err = await res.json();
                alert(err.error || "삭제 실패");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
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
            const code = codes.find(c => c.id === cId);
            if (!code || code.parent_id === null) return false;
            if (code.parent_id === pId) return true;
            return isDescendant(pId, code.parent_id);
        };

        if (targetId !== null && (sourceId === targetId || isDescendant(sourceId, targetId))) {
            if (pos === "inside") { alert("상위 코드를 하위 코드로 이동할 수 없습니다."); return; }
        }

        let nextParentId: number | null = null;
        let nextOrder = 0;

        if (targetId === null) {
            nextParentId = null;
            const roots = codes.filter(c => c.parent_id === null && c.id !== sourceId).sort((a, b) => a.display_order - b.display_order);
            nextOrder = roots.length > 0 ? roots[roots.length - 1].display_order + 1000 : 1000;
        } else {
            const targetCode = codes.find(c => c.id === targetId)!;
            if (pos === "inside") {
                nextParentId = targetId;
                const children = codes.filter(c => c.parent_id === targetId && c.id !== sourceId).sort((a, b) => a.display_order - b.display_order);
                nextOrder = children.length > 0 ? children[children.length - 1].display_order + 1000 : 1000;
            } else {
                nextParentId = targetCode.parent_id;
                const siblings = codes.filter(c => c.parent_id === nextParentId && c.id !== sourceId).sort((a, b) => {
                    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
                    return a.name.localeCompare(b.name);
                });
                const idx = siblings.findIndex(s => s.id === targetId);
                if (pos === "before") {
                    const prev = siblings[idx - 1];
                    nextOrder = prev ? (prev.display_order + targetCode.display_order) / 2 : targetCode.display_order - 1000;
                } else {
                    const next = siblings[idx + 1];
                    nextOrder = next ? (targetCode.display_order + next.display_order) / 2 : targetCode.display_order + 1000;
                }
            }
        }

        try {
            const res = await fetch(`/api/codes/${sourceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ parent_id: nextParentId, display_order: nextOrder }),
            });
            if (res.ok) { await fetchCodes(); if (nextParentId) setExpandedIds(prev => new Set(prev).add(nextParentId!)); }
        } catch (error) { console.error(error); }
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const renderNode = (code: Code, level = 0) => {
        const isExpanded = expandedIds.has(code.id);
        const isSelected = selectedCodeId === code.id;
        const dragInfo = dragOverInfo?.id === code.id ? dragOverInfo : null;

        return (
            <div key={code.id} className="relative select-none group/node">
                {dragInfo?.position === "before" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, code.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, code.id)}
                    onDrop={(e) => handleDrop(e, code.id)}
                    onClick={() => handleSelect(code)}
                    className={cn(
                        "group flex items-center justify-between px-8 py-3 cursor-pointer transition-all duration-300 border-b border-border/5",
                        isSelected ? "bg-primary/5 text-primary border-primary/10" : "bg-transparent border-transparent hover:bg-muted/30",
                        dragInfo?.position === "inside" ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
                    )}
                >
                    <div
                        className={cn("flex items-center gap-2 overflow-hidden", isDragging ? "pointer-events-none" : "")}
                        style={{ paddingLeft: `${level * 20}px` }}
                    >
                        <GripVertical size={14} className={cn(isSelected ? "text-primary/50" : "text-muted-foreground opacity-0 group-hover:opacity-100")} />
                        {(code.children?.length ?? 0) > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(code.id); }} className={cn("p-1 rounded-lg shrink-0 transition-colors", isSelected ? "hover:bg-primary/10" : "hover:bg-secondary")}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : <div className="w-6 shrink-0" />}
                        {level === 0 ? <LayoutGrid size={16} className={isSelected ? "text-primary/70" : "text-slate-400"} /> : <CodeIcon size={14} className={isSelected ? "text-primary/70" : "text-slate-400"} />}
                        <span className={cn("text-sm tracking-tight", isSelected ? "font-bold" : "font-medium text-slate-700")}>{code.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter opacity-50">[{code.code}]</span>
                    </div>
                    <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all", isDragging ? "pointer-events-none" : "")}>
                        <button onClick={(e) => { e.stopPropagation(); handleStartAdd(code.id, e.currentTarget.getBoundingClientRect()); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90" title="하위 코드 추가"><Plus size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(code, e.currentTarget.getBoundingClientRect()); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90" title="수정"><Edit size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(code.id); }} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90" title="삭제"><Trash2 size={14} /></button>
                    </div>
                </div>
                {dragInfo?.position === "after" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10 rounded-full shadow-[0_0_8px_var(--primary)]" />}
                {isExpanded && code.children && (
                    <div className="">
                        {code.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const selectedCode = useMemo(() => codes.find(c => c.id === selectedCodeId), [codes, selectedCodeId]);

    const subCodes = useMemo(() => {
        if (!selectedCodeId) return [];
        return codes.filter(c => c.parent_id === selectedCodeId).sort((a, b) => a.display_order - b.display_order);
    }, [codes, selectedCodeId]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        공통 코드
                    </h1>
                </div>
                <Button
                    onClick={(e) => handleStartAdd(null, e.currentTarget.getBoundingClientRect())}
                    variant="primary"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    코드
                </Button>
            </div>

            <div className="flex flex-col md:flex-row h-[calc(100vh-16rem)] gap-6">
                {/* Code Tree Sidebar */}
                <aside
                    className="w-full md:w-[450px] flex flex-col neo-light-card overflow-hidden border border-border/40 bg-white"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <CodeIcon size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">코드 구성</h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Explorer</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-4 border-b border-border/5 bg-white">
                        <SearchInput
                            placeholder="코드 또는 명칭 검색..."
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar-main bg-white">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredCodeTree.length > 0 ? (
                                    filteredCodeTree.map(node => renderNode(node))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center gap-4 opacity-40">
                                        <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            {treeSearch ? "검색 결과가 없습니다" : "코드 현황이 없습니다"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{codes.length}</span></div>
                    </div>
                </aside>

                {/* Detail View */}
                <main className="flex-1 flex flex-col neo-light-card overflow-hidden border border-border/40 bg-white relative">
                    {selectedCodeId ? (
                        <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Header */}
                            <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Boxes size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{selectedCode?.name} 하위 목록</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Sub-Codes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto custom-scrollbar-main">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="px-2 py-3 text-sm text-slate-900 text-center w-20 whitespace-nowrap">순서</TableHead>
                                            <TableHead className="px-6 py-3 text-sm text-slate-700 text-left">코드</TableHead>
                                            <TableHead className="px-6 py-3 text-sm text-slate-700 text-left">코드명</TableHead>
                                            <TableHead className="px-6 py-3 text-sm text-slate-700 text-left">설명</TableHead>
                                            <TableHead className="px-6 py-3 text-sm text-slate-700 text-right">작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/10">
                                        {subCodes.length > 0 ? (
                                            subCodes.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                    <TableCell className="whitespace-nowrap px-8 py-4 text-sm text-slate-500 text-center font-normal">{item.display_order}</TableCell>
                                                    <TableCell className="whitespace-nowrap px-6 py-4">
                                                        <span className="px-2 py-0.5 rounded-md bg-muted/50 text-xs font-normal text-slate-600 border border-border/10 font-mono">{item.code}</span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-normal text-slate-700">{item.name}</TableCell>
                                                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 max-w-[300px] truncate font-normal">{item.description}</TableCell>
                                                    <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={(e) => handleEditStart(item, e.currentTarget.getBoundingClientRect())} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"><Edit size={14} /></button>
                                                            {!item.is_system && (
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"><Trash2 size={14} /></button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                        <CodeIcon size={40} className="text-muted-foreground/30" />
                                                        <div className="space-y-1">
                                                            <p className="text-base font-medium text-foreground">하위 코드가 없습니다</p>
                                                            <p className="text-sm text-muted-foreground">분류 상세를 구성하여 시스템에서 활용하세요</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* footer */}
                            <div className="bg-muted/30 px-8 py-3 border-t border-border/10">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{subCodes.length}</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-24 gap-4 opacity-40 text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">코드가 선택되지 않았습니다</p>
                                <p className="text-sm text-muted-foreground">왼쪽 트리에서 코드를 선택하여 상세 항목을 확인하세요</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Code Modal */}
            <DraggablePanel
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                triggerRect={triggerRect}
                title={isAdding ? "신규 코드 등록" : "코드 정보 수정"}
                description="시스템 전반에서 사용되는 공통 코드를 관리합니다."
                className="max-w-xl"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">코드 ID <span className="text-primary">*</span></label>
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    required
                                    readOnly
                                    value={formData.code}
                                    className="w-full rounded-md border border-gray-300 bg-slate-50 pl-3 pr-10 py-2 text-sm focus:outline-none transition-all font-mono uppercase cursor-default text-slate-500"
                                    placeholder="E.g. CD_001"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">코드명 <span className="text-primary">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                placeholder=""
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">상위 분류</label>
                            <Dropdown
                                value={formData.parent_id?.toString() || ""}
                                onChange={(val) => setFormData({ ...formData, parent_id: val === "" ? "" : Number(val) })}
                                options={hierarchicalOptions}
                                variant="standard"
                                placeholder="상위 분류 선택"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">표시 순서</label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">코드 설명</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 resize-none"
                            placeholder="본 코드의 용도나 사용처를 입력하세요"
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

export default function CodesPage() {
    return (
        <Suspense fallback={
            <div className="h-full flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <CodesContent />
        </Suspense>
    );
}
