"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<LaborCategory | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  const handleAdd = () => {
    setFormData({ id: "", name: "", description: "" });
    setIsAddModalOpen(true);
  };

  const handleEdit = (role: LaborCategory) => {
    setFormData({
      id: role.code,
      name: role.name,
      description: role.description || "",
    });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            인력구분 관리
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
            M/D 산정 매트릭스에 사용되는 핵심 인력 노드를 관리합니다.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          신규 인력구분 추가
        </button>
      </div>

      <div className="neo-light-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-main">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                  Category ID
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                  Display Name / Label
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                  Descriptive Context
                </th>
                <th className="relative px-8 py-5">
                  <span className="sr-only">Operations</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs font-bold text-muted-foreground animate-pulse tracking-widest uppercase">Initializing Category Repository...</p>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground italic">등록된 인력구분 노드가 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="whitespace-nowrap px-8 py-5">
                      <span className="text-sm font-bold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono italic">
                        {role.code}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-foreground tracking-tight">
                      {role.name}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground/80">
                      {role.description || <span className="text-muted-foreground/30 italic">No additional context provided</span>}
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          title="Modify Node"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                          title="Purge Node"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/30 px-8 py-5 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-40">System Role Index</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <div className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Total Active Nodes: <span className="text-primary ml-1">{roles.length}</span></div>
          </div>
        </div>
      </div>

      {/* 추가/수정 모달 - Neo Integrated */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setEditingRole(null);
            }}
          />
          <div className="relative w-full max-w-lg neo-light-card border-white bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="border-b border-border/40 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {isAddModalOpen ? "신규 인력구분 등록" : "인력구분 속성 수정"}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60 italic">
                    Category Node Configuration Manager
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                  Unique Identifier (ID) <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  disabled={isEditModalOpen}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="예: PM, DEV, DESIGN"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none disabled:opacity-50 disabled:bg-muted/40 font-mono italic"
                />
                {isEditModalOpen && <p className="text-[9px] font-bold text-muted-foreground opacity-50 ml-1">Unique IDs cannot be modified after registration.</p>}
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                  Display Label <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="인력구분 호출 명칭"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                  Operational Context / Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="해당 인력 노드에 대한 상세 설명을 입력하세요"
                  rows={3}
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-8 bg-muted/10 border-t border-border/20">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingRole(null);
                  setFormData({ id: "", name: "", description: "" });
                }}
                className="rounded-2xl border border-border/40 bg-white px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
              >
                Abort
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || (!isEditModalOpen && !formData.id)}
                className="rounded-2xl bg-primary px-8 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
              >
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
