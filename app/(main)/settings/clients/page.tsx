"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Calculator,
} from "lucide-react";
import { ProductMaster } from "@/components/ProductMaster";
import { UnitPriceLaborTab, UnitPriceLaborTabHandle } from "@/components/UnitPriceLaborTab";
import { useRef } from "react";

interface Client {
  id: number;
  name: string;
  type: string;
  code: string | null;
  description: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface LaborCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"unit-price-labor" | "unit-price-product" | "clients" | "labor">("unit-price-labor");
  const unitPriceLaborRef = useRef<UnitPriceLaborTabHandle>(null);

  // 고객사 관리 상태
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditClientMode, setIsEditClientMode] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: "",
    description: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  // 인력구분 관리 상태
  const [laborCategories, setLaborCategories] = useState<LaborCategory[]>([]);
  const [laborLoading, setLaborLoading] = useState(true);
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isEditLaborModalOpen, setIsEditLaborModalOpen] = useState(false);
  const [editingLabor, setEditingLabor] = useState<LaborCategory | null>(null);
  const [laborFormData, setLaborFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  // 제품 단가 관리 상태
  const [productNewTrigger, setProductNewTrigger] = useState(0);

  // Read tab from URL on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "unit-price-labor" || tab === "unit-price-product" || tab === "clients" || tab === "labor") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 고객사 관리
  useEffect(() => {
    if (activeTab === "clients") {
      fetchClients();
    }
  }, [activeTab, searchTerm]);

  // 인력구분 관리
  useEffect(() => {
    if (activeTab === "labor") {
      fetchLaborCategories();
    }
  }, [activeTab]);

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchLaborCategories = async () => {
    try {
      setLaborLoading(true);
      const response = await fetch("/api/labor-categories");
      if (response.ok) {
        const data = await response.json();
        setLaborCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching labor categories:", error);
    } finally {
      setLaborLoading(false);
    }
  };

  // 고객사 관리 핸들러
  const handleOpenClientModal = (client?: Client) => {
    if (client) {
      setIsEditClientMode(true);
      setEditingClient(client);
      setClientFormData({
        name: client.name || "",
        description: client.description || "",
        contact_person: client.contact_person || "",
        contact_email: client.contact_email || "",
        contact_phone: client.contact_phone || "",
      });
    } else {
      setIsEditClientMode(false);
      setEditingClient(null);
      setClientFormData({
        name: "",
        description: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
      });
    }
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setIsEditClientMode(false);
    setEditingClient(null);
    setClientFormData({
      name: "",
      description: "",
      contact_person: "",
      contact_email: "",
      contact_phone: "",
    });
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClient(true);

    try {
      const url = isEditClientMode
        ? `/api/clients/${editingClient?.id}`
        : "/api/clients";
      const method = isEditClientMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: clientFormData.name,
          type: "customer",
          code: isEditClientMode && editingClient?.code ? editingClient.code : null,
          description: clientFormData.description || null,
          contact_person: clientFormData.contact_person || null,
          contact_email: clientFormData.contact_email || null,
          contact_phone: clientFormData.contact_phone || null,
        }),
      });

      if (response.ok) {
        handleCloseClientModal();
        fetchClients();
        alert(isEditClientMode ? "클라이언트가 수정되었습니다." : "클라이언트가 생성되었습니다.");
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error saving client:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleDeleteClient = async (id: number, name: string) => {
    if (!window.confirm(`정말 "${name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchClients();
        alert("클라이언트가 삭제되었습니다.");
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error deleting client:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  // 인력구분 관리 핸들러
  const handleAddLabor = () => {
    setLaborFormData({ id: "", name: "", description: "" });
    setIsAddLaborModalOpen(true);
  };

  const handleEditLabor = (category: LaborCategory) => {
    setLaborFormData({
      id: category.code,
      name: category.name,
      description: category.description || "",
    });
    setEditingLabor(category);
    setIsEditLaborModalOpen(true);
  };

  const handleDeleteLabor = async (id: number) => {
    if (window.confirm("인력구분을 삭제하시겠습니까?")) {
      try {
        const response = await fetch(`/api/labor-categories/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await fetchLaborCategories();
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const handleSaveLabor = async () => {
    try {
      if (isAddLaborModalOpen) {
        if (laborFormData.id && laborFormData.name) {
          const response = await fetch("/api/labor-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: laborFormData.id,
              name: laborFormData.name,
              description: laborFormData.description || null,
            }),
          });
          if (response.ok) {
            await fetchLaborCategories();
            setIsAddLaborModalOpen(false);
            setLaborFormData({ id: "", name: "", description: "" });
          } else {
            alert("추가에 실패했습니다.");
          }
        }
      } else if (isEditLaborModalOpen && editingLabor) {
        const response = await fetch(`/api/labor-categories/${editingLabor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: laborFormData.name,
            description: laborFormData.description || null,
          }),
        });
        if (response.ok) {
          await fetchLaborCategories();
          setIsEditLaborModalOpen(false);
          setEditingLabor(null);
          setLaborFormData({ id: "", name: "", description: "" });
        } else {
          alert("수정에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.code &&
        client.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            프로젝트 기준정보 관리
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
            고객사, 인력/제품 단가 및 인력구분 체계를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "unit-price-labor" && (
            <button
              onClick={() => unitPriceLaborRef.current?.handleAdd()}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              신규 인력 단가 등록
            </button>
          )}
          {activeTab === "unit-price-product" && (
            <button
              onClick={() => setProductNewTrigger((v) => v + 1)}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              신규 제품 단가 등록
            </button>
          )}
          {activeTab === "clients" && (
            <button
              onClick={() => handleOpenClientModal()}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              신규 고객사 등록
            </button>
          )}
          {activeTab === "labor" && (
            <button
              onClick={handleAddLabor}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              신규 인력구분 추가
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 - Neo Modern Style */}
      <div className="flex p-1.5 bg-muted/30 rounded-[1.5rem] border border-border/20 self-start mx-1 overflow-x-auto no-scrollbar">
        {[
          { id: "unit-price-labor", label: "인력 단가" },
          { id: "unit-price-product", label: "제품 단가" },
          { id: "clients", label: "고객사 관리" },
          { id: "labor", label: "인력구분 관리" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3 rounded-[1.1rem] text-sm font-bold transition-all duration-500 whitespace-nowrap ${activeTab === tab.id
              ? "bg-white text-primary shadow-sm ring-1 ring-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-white/40"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="neo-light-card min-h-[500px] overflow-hidden">
        {/* 인력 단가 탭 */}
        {activeTab === "unit-price-labor" && (
          <div className="p-1">
            <UnitPriceLaborTab ref={unitPriceLaborRef} />
          </div>
        )}

        {/* 제품 단가 탭 */}
        {activeTab === "unit-price-product" && (
          <div className="p-8 space-y-6">
            <div className="p-1 rounded-3xl bg-muted/5 border border-border/10">
              <ProductMaster fullPage={false} externalNewTrigger={productNewTrigger} />
            </div>
          </div>
        )}

        {/* 고객사 관리 탭 */}
        {activeTab === "clients" && (
          <div className="space-y-6 p-8">
            {/* 검색 */}
            <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="고객사 이름 또는 식별 코드로 정밀 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-white border border-border/40 py-4 pl-14 pr-8 text-base font-semibold shadow-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:outline-none transition-all duration-300"
              />
            </div>

            {/* 클라이언트 목록 */}
            <div className="overflow-x-auto custom-scrollbar-main border border-border/20 rounded-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      고객사명
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      식별 코드
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      담당자
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      연락처 정보
                    </th>
                    <th className="relative px-8 py-5">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {clientsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-xs font-bold text-muted-foreground animate-pulse tracking-widest uppercase">고객사 정보를 불러오고 있습니다...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm font-bold text-muted-foreground italic">데이터가 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="whitespace-nowrap px-8 py-5">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-4 group-hover:scale-110 transition-transform">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="text-base font-bold text-foreground tracking-tight">
                              {client.name}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5">
                          <span className="text-xs font-bold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono">
                            {client.code || "NO-CODE-IDS"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-sm font-bold text-foreground/70">
                          {client.contact_person || <span className="text-muted-foreground/30 italic">미지정</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-5">
                          <div className="text-sm font-medium text-foreground/80">{client.contact_email || "-"}</div>
                          <div className="text-[10px] font-bold text-muted-foreground mt-0.5 tracking-tight">{client.contact_phone || "-"}</div>
                        </td>
                        <td className="whitespace-nowrap px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenClientModal(client)}
                              className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                              title="수정"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                              title="삭제"
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

            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-40">고객사 목록</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <div className="text-xs font-bold text-foreground/50 uppercase tracking-widest">전체 등록 수: <span className="text-primary ml-1">{filteredClients.length}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* 인력구분 관리 탭 */}
        {activeTab === "labor" && (
          <div className="p-8 space-y-6">
            <div className="overflow-x-auto custom-scrollbar-main border border-border/20 rounded-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      구분 코드
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      표시 이름
                    </th>
                    <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                      설명
                    </th>
                    <th className="relative px-8 py-5">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {laborLoading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-xs font-bold text-muted-foreground animate-pulse tracking-widest uppercase">설정 정보를 불러오고 있습니다...</p>
                        </div>
                      </td>
                    </tr>
                  ) : laborCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm font-bold text-muted-foreground italic">등록된 인력구분이 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    laborCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="whitespace-nowrap px-8 py-5">
                          <span className="text-sm font-bold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono italic">
                            {category.code}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 text-base font-bold text-foreground tracking-tight">
                          {category.name}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-muted-foreground/80">
                          {category.description || <span className="text-muted-foreground/20 italic">설명 없음</span>}
                        </td>
                        <td className="whitespace-nowrap px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transition-transform">
                            <button
                              onClick={() => handleEditLabor(category)}
                              className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                              title="수정"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLabor(category.id)}
                              className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                              title="삭제"
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
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-40">인력구분 설정 목록</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <div className="text-xs font-bold text-foreground/50 uppercase tracking-widest">전체 등록 수: <span className="text-primary ml-1">{laborCategories.length}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 고객사 관리 모달 - Neo Integrated */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={handleCloseClientModal} />
          <div className="relative w-full max-w-2xl neo-light-card border-white bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="border-b border-border/40 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {isEditClientMode ? "고객사 수정" : "신규 고객사 등록"}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60 italic">
                    고객사 정보 관리
                  </p>
                </div>
              </div>
              <button onClick={handleCloseClientModal} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClient} className="p-8 space-y-6">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  고객사명 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  placeholder="고객사 정식 명칭을 입력하세요"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  설명
                </label>
                <textarea
                  rows={3}
                  value={clientFormData.description}
                  onChange={(e) => setClientFormData({ ...clientFormData, description: e.target.value })}
                  placeholder="고객사에 대한 상세 설명 또는 영업 컨텍스트를 입력하세요"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    주 담당자
                  </label>
                  <input
                    type="text"
                    value={clientFormData.contact_person}
                    onChange={(e) => setClientFormData({ ...clientFormData, contact_person: e.target.value })}
                    placeholder="담당자 성함"
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    value={clientFormData.contact_email}
                    onChange={(e) => setClientFormData({ ...clientFormData, contact_email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  연락처 (전화번호)
                </label>
                <input
                  type="tel"
                  value={clientFormData.contact_phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, contact_phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/20">
                <button
                  type="button"
                  onClick={handleCloseClientModal}
                  className="rounded-2xl border border-border/40 bg-white px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClient}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-8 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
                >
                  <Save className="h-4 w-4" />
                  {isSubmittingClient ? "저장 중..." : isEditClientMode ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 인력구분 추가/수정 모달 - Neo Integrated */}
      {(isAddLaborModalOpen || isEditLaborModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              setIsAddLaborModalOpen(false);
              setIsEditLaborModalOpen(false);
              setEditingLabor(null);
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
                    {isAddLaborModalOpen ? "신규 인력구분 등록" : "인력구분 수정"}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
                    인력 체계 관리
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  구분 코드 (ID) <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={laborFormData.id}
                  disabled={isEditLaborModalOpen}
                  onChange={(e) => setLaborFormData({ ...laborFormData, id: e.target.value })}
                  placeholder="예: PM, DEV, UX"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none disabled:opacity-50 disabled:bg-muted/40 font-mono italic"
                />
                {isEditLaborModalOpen && <p className="text-[9px] font-bold text-muted-foreground opacity-50 ml-1">부서 코드는 수정할 수 없습니다.</p>}
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  표시 이름 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={laborFormData.name}
                  onChange={(e) => setLaborFormData({ ...laborFormData, name: e.target.value })}
                  placeholder="인력구분 표시 이름"
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-base font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  상세 설명
                </label>
                <textarea
                  value={laborFormData.description}
                  onChange={(e) => setLaborFormData({ ...laborFormData, description: e.target.value })}
                  placeholder="해당 인력 노드에 대한 상세 메타정보를 입력하세요"
                  rows={3}
                  className="w-full rounded-[1.25rem] bg-muted/20 border-transparent py-4 px-5 text-sm font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-8 bg-muted/10 border-t border-border/20">
              <button
                onClick={() => {
                  setIsAddLaborModalOpen(false);
                  setIsEditLaborModalOpen(false);
                  setEditingLabor(null);
                  setLaborFormData({ id: "", name: "", description: "" });
                }}
                className="rounded-2xl border border-border/40 bg-white px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
              >
                Abort
              </button>
              <button
                onClick={handleSaveLabor}
                disabled={!laborFormData.name || (!isEditLaborModalOpen && !laborFormData.id)}
                className="rounded-2xl bg-primary px-8 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
              >
                Commit Schema Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
