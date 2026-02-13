"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  DraggablePanel,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface LaborCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<LaborCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/labor-categories");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching labor categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return roles.slice(startIndex, startIndex + itemsPerPage);
  }, [roles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [editingRole, setEditingRole] = useState<LaborCategory | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  const handleAdd = (e: React.MouseEvent) => {
    setFormData({ id: "", name: "", description: "" });
    setTriggerRect(e.currentTarget.getBoundingClientRect());
    setIsAddModalOpen(true);
  };

  const handleEdit = (role: LaborCategory, e: React.MouseEvent) => {
    setFormData({
      id: role.code,
      name: role.name,
      description: role.description || "",
    });
    setTriggerRect(e.currentTarget.getBoundingClientRect());
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("인력구분을 삭제하시겠습니까?")) {
      try {
        const response = await fetch(`/api/labor-categories/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await fetchCategories();
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isAddModalOpen) {
        // 새로 추가
        if (formData.id && formData.name) {
          const response = await fetch("/api/labor-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: formData.id,
              name: formData.name,
              description: formData.description || null,
            }),
          });
          if (response.ok) {
            await fetchCategories();
            setIsAddModalOpen(false);
            setFormData({ id: "", name: "", description: "" });
          } else {
            alert("추가에 실패했습니다.");
          }
        }
      } else if (isEditModalOpen && editingRole) {
        // 수정
        const response = await fetch(`/api/labor-categories/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
          }),
        });
        if (response.ok) {
          await fetchCategories();
          setIsEditModalOpen(false);
          setEditingRole(null);
          setFormData({ id: "", name: "", description: "" });
        } else {
          alert("수정에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            인력구분 관리
          </h1>
        </div>
        <Button
          onClick={(e) => handleAdd(e)}
          variant="primary"
          className="h-11 px-6"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          인력구분
        </Button>
      </div>

      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">Category ID</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">표시 이름</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">설명</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-medium text-foreground">등록된 인력구분이 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRoles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <span className="text-sm font-bold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono italic">
                        {role.code}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3 text-sm font-bold text-foreground tracking-tight">
                      {role.name}
                    </TableCell>
                    <TableCell className="px-8 py-3 text-sm font-medium text-muted-foreground/80">
                      {role.description || <span className="text-muted-foreground/30 italic">설명 없음</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button
                          onClick={(e) => handleEdit(role, e)}
                          className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          title="수정"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
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
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{roles.length}</span></div>

            <div className="flex items-center gap-2 border-l border-border/40 pl-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
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

      <DraggablePanel
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={(val) => {
          if (!val) {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setEditingRole(null);
            setFormData({ id: "", name: "", description: "" });
          }
        }}
        triggerRect={triggerRect}
        title={isAddModalOpen ? "신규 인력구분 등록" : "인력구분 속성 수정"}
        description="인력의 구분을 정의하고 관리합니다."
        className="max-w-lg"
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              코드 (ID) {!isEditModalOpen && <span className="text-primary">*</span>}
            </label>
            <input
              type="text"
              value={formData.id}
              disabled={isEditModalOpen}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="예: PM, DEV, DESIGN"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all disabled:bg-muted/30 disabled:text-muted-foreground/60"
            />
            {isEditModalOpen && <p className="text-[10px] text-muted-foreground mt-1">등록된 코드는 수정할 수 없습니다.</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              표시 명칭 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="인력구분 호출 명칭"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="상세 내용을 입력하세요"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingRole(null);
                setFormData({ id: "", name: "", description: "" });
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || (!isEditModalOpen && !formData.id)}
              className="px-8 min-w-[120px]"
            >
              저장
            </Button>
          </div>
        </div>
      </DraggablePanel>
    </div>
  );
}
