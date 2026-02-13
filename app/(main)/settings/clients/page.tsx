"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Calculator,
  Layers,
} from "lucide-react";
import { ProductMaster } from "@/components/ProductMaster";
import { UnitPriceLaborTab, UnitPriceLaborTabHandle } from "@/components/UnitPriceLaborTab";
import { ProjectPhaseTab, ProjectPhaseTabHandle } from "@/components/ProjectPhaseTab";
import { SearchInput, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, DraggablePanel } from "@/components/ui";
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
  const [activeTab, setActiveTab] = useState<"phases" | "unit-price-labor" | "unit-price-product" | "clients" | "labor">("phases");
  const projectPhaseRef = useRef<ProjectPhaseTabHandle>(null);
  const unitPriceLaborRef = useRef<UnitPriceLaborTabHandle>(null);

  // 공통 트리거 위치 상태
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  // 고객사 관리 상태
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [clientItemsPerPage, setClientItemsPerPage] = useState(10);

  const [laborSearchTerm, setLaborSearchTerm] = useState("");
  const [laborPage, setLaborPage] = useState(1);
  const [laborItemsPerPage, setLaborItemsPerPage] = useState(10);
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
    if (tab === "phases" || tab === "unit-price-labor" || tab === "unit-price-product" || tab === "clients" || tab === "labor") {
      setActiveTab(tab as any);
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
  const handleOpenClientModal = (client?: Client, rect?: DOMRect) => {
    if (rect) setTriggerRect(rect);
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
  const handleAddLabor = (rect?: DOMRect) => {
    if (rect) setTriggerRect(rect);
    setLaborFormData({ id: "", name: "", description: "" });
    setIsAddLaborModalOpen(true);
  };

  const handleEditLabor = (category: LaborCategory, rect?: DOMRect) => {
    if (rect) setTriggerRect(rect);
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


  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedClients = filteredClients.slice(
    (clientPage - 1) * clientItemsPerPage,
    clientPage * clientItemsPerPage
  );

  const clientTotalPages = Math.ceil(filteredClients.length / clientItemsPerPage);

  const filteredLaborCategories = laborCategories.filter(l =>
    l.name.toLowerCase().includes(laborSearchTerm.toLowerCase()) ||
    l.code.toLowerCase().includes(laborSearchTerm.toLowerCase())
  );

  const paginatedLabor = filteredLaborCategories.slice(
    (laborPage - 1) * laborItemsPerPage,
    laborPage * laborItemsPerPage
  );

  const laborTotalPages = Math.ceil(filteredLaborCategories.length / laborItemsPerPage);

  useEffect(() => {
    setClientPage(1);
  }, [searchTerm, clientItemsPerPage]);

  useEffect(() => {
    setLaborPage(1);
  }, [laborSearchTerm, laborItemsPerPage]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            프로젝트 기준정보 관리
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
            사업 단계, 고객사, 인력/제품 단가 및 인력 구분 체계를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "phases" && (
            <button
              onClick={(e) => projectPhaseRef.current?.handleAdd(e.currentTarget.getBoundingClientRect())}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              단계
            </button>
          )}
          {activeTab === "unit-price-labor" && (
            <button
              onClick={() => unitPriceLaborRef.current?.handleAdd()}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              인력 단가
            </button>
          )}
          {activeTab === "unit-price-product" && (
            <button
              onClick={() => setProductNewTrigger((v) => v + 1)}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              제품 단가
            </button>
          )}
          {activeTab === "clients" && (
            <button
              onClick={(e) => handleOpenClientModal(undefined, e.currentTarget.getBoundingClientRect())}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              고객사
            </button>
          )}
          {activeTab === "labor" && (
            <button
              onClick={(e) => handleAddLabor(e.currentTarget.getBoundingClientRect())}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              인력 구분
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "phases", label: "사업 단계" },
            { id: "unit-price-labor", label: "인력 단가" },
            { id: "unit-price-product", label: "제품 단가" },
            { id: "clients", label: "고객사" },
            { id: "labor", label: "인력 구분" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="space-y-8">
        {/* 사업 단계 탭 */}
        {activeTab === "phases" && (
          <div className="p-1">
            <ProjectPhaseTab ref={projectPhaseRef} />
          </div>
        )}

        {/* 인력 단가 탭 */}
        {activeTab === "unit-price-labor" && (
          <div className="p-1">
            <UnitPriceLaborTab ref={unitPriceLaborRef} />
          </div>
        )}

        {/* 제품 단가 탭 */}
        {activeTab === "unit-price-product" && (
          <div className="p-1">
            <ProductMaster fullPage={false} externalNewTrigger={productNewTrigger} />
          </div>
        )}

        {/* 고객사 관리 탭 */}
        {activeTab === "clients" && (
          <div className="p-1 space-y-8">
            {/* 검색 */}
            <div className="flex items-center gap-x-4 mx-1">
              <SearchInput
                placeholder="고객사 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 클라이언트 목록 */}
            <div className="neo-light-card overflow-hidden border border-border/40">
              <div className="overflow-x-auto custom-scrollbar-main">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">고객사명</TableHead>
                      <TableHead align="center" className="px-8 py-3 text-sm text-slate-900 text-center">담당자</TableHead>
                      <TableHead align="center" className="px-8 py-3 text-sm text-slate-900 text-center">연락처 정보</TableHead>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/10">
                    {clientsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                              <Building2 className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium text-foreground">등록된 고객사가 없습니다</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <TableCell className="px-8 py-3">
                            <div className="flex items-center">
                              <div className="text-sm text-slate-900">
                                {client.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell align="center" className="px-8 py-3 text-sm text-slate-700">
                            {client.contact_person || <span className="text-slate-400">미지정</span>}
                          </TableCell>
                          <TableCell align="center" className="px-8 py-3">
                            <div className="text-sm text-slate-600 truncate max-w-[200px]">
                              {client.contact_email || "-"}
                              {client.contact_phone && <span className="text-[10px] text-slate-400 ml-2 tracking-tighter">({client.contact_phone})</span>}
                            </div>
                          </TableCell>
                          <TableCell className="px-8 py-3 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleOpenClientModal(client, e.currentTarget.getBoundingClientRect())}
                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                title="수정"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id, client.name)}
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
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{filteredClients.length}</span></div>

                  <div className="flex items-center gap-2 border-l border-border/40 pl-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
                    <select
                      value={clientItemsPerPage}
                      onChange={(e) => {
                        setClientItemsPerPage(Number(e.target.value));
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
                    onClick={() => setClientPage(prev => Math.max(1, prev - 1))}
                    disabled={clientPage === 1}
                    className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: clientTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setClientPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                          clientPage === page
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-white hover:text-foreground"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setClientPage(prev => Math.min(clientTotalPages, prev + 1))}
                    disabled={clientPage === clientTotalPages}
                    className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 인력 구분 탭 */}
        {activeTab === "labor" && (
          <div className="p-1 space-y-8">
            {/* 검색 */}
            <div className="flex items-center gap-x-4 mx-1">
              <SearchInput
                placeholder="코드 또는 인력 구분 이름으로 검색..."
                value={laborSearchTerm}
                onChange={(e) => setLaborSearchTerm(e.target.value)}
              />
            </div>

            <div className="neo-light-card overflow-hidden border border-border/40">
              <div className="overflow-x-auto custom-scrollbar-main">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">구분 코드</TableHead>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">표시 이름</TableHead>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">설명</TableHead>
                      <TableHead className="px-8 py-3 text-sm text-slate-900 text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/10">
                    {laborLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLaborCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-8 py-24 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                              <Users className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium text-foreground">등록된 인력 구분이 없습니다</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLabor.map((category) => (
                        <TableRow key={category.id} className="hover:bg-primary/[0.02] transition-colors group">
                          <TableCell className="px-8 py-3">
                            <span className="text-xs text-slate-600 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono">
                              {category.code}
                            </span>
                          </TableCell>
                          <TableCell className="px-8 py-3 text-sm text-slate-900">
                            {category.name}
                          </TableCell>
                          <TableCell className="px-8 py-3 text-sm text-slate-600">
                            {category.description || <span className="text-slate-400">설명 없음</span>}
                          </TableCell>
                          <TableCell className="px-8 py-3 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transition-transform">
                              <button
                                onClick={(e) => handleEditLabor(category, e.currentTarget.getBoundingClientRect())}
                                className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                title="수정"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLabor(category.id)}
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
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{filteredLaborCategories.length}</span></div>

                  <div className="flex items-center gap-2 border-l border-border/40 pl-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
                    <select
                      value={laborItemsPerPage}
                      onChange={(e) => {
                        setLaborItemsPerPage(Number(e.target.value));
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
                    onClick={() => setLaborPage(prev => Math.max(1, prev - 1))}
                    disabled={laborPage === 1}
                    className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: laborTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setLaborPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                          laborPage === page
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-white hover:text-foreground"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setLaborPage(prev => Math.min(laborTotalPages, prev + 1))}
                    disabled={laborPage === laborTotalPages}
                    className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all font-bold"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 고객사 관리 모달 */}
      <DraggablePanel
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        triggerRect={triggerRect}
        title={isEditClientMode ? "고객사 수정" : "신규 고객사 등록"}
        description="고객사 정보를 관리합니다."
        className="max-w-lg"
      >
        <form onSubmit={handleSubmitClient} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              고객사명 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={clientFormData.name}
              onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
              placeholder="고객사 정식 명칭을 입력하세요"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              설명
            </label>
            <textarea
              rows={3}
              value={clientFormData.description}
              onChange={(e) => setClientFormData({ ...clientFormData, description: e.target.value })}
              placeholder="고객사에 대한 상세 설명 또는 영업 컨텍스트를 입력하세요"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                주 담당자
              </label>
              <input
                type="text"
                value={clientFormData.contact_person}
                onChange={(e) => setClientFormData({ ...clientFormData, contact_person: e.target.value })}
                placeholder="담당자 성함"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                이메일 주소
              </label>
              <input
                type="email"
                value={clientFormData.contact_email}
                onChange={(e) => setClientFormData({ ...clientFormData, contact_email: e.target.value })}
                placeholder="email@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              연락처 (전화번호)
            </label>
            <input
              type="tel"
              value={clientFormData.contact_phone}
              onChange={(e) => setClientFormData({ ...clientFormData, contact_phone: e.target.value })}
              placeholder="010-0000-0000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCloseClientModal}
              className="h-10 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmittingClient}
              className="inline-flex items-center gap-2.5 rounded-md bg-primary px-8 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
            >
              <Save className="h-4 w-4" />
              {isSubmittingClient ? "저장 중..." : isEditClientMode ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </DraggablePanel>

      {/* 인력 구분 추가/수정 모달 */}
      <DraggablePanel
        open={isAddLaborModalOpen || isEditLaborModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddLaborModalOpen(false);
            setIsEditLaborModalOpen(false);
            setEditingLabor(null);
          }
        }}
        triggerRect={triggerRect}
        title={isAddLaborModalOpen ? "신규 인력 구분 등록" : "인력 구분 수정"}
        description="인력 체계 정보를 관리합니다."
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              구분 코드 (ID) <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={laborFormData.id}
              disabled={isEditLaborModalOpen}
              onChange={(e) => setLaborFormData({ ...laborFormData, id: e.target.value })}
              placeholder="예: PM, DEV, UX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-muted/30 disabled:text-muted-foreground/60 font-mono"
            />
            {isEditLaborModalOpen && <p className="text-[10px] text-muted-foreground opacity-50 ml-1">부서 코드는 수정할 수 없습니다.</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              표시 이름 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={laborFormData.name}
              onChange={(e) => setLaborFormData({ ...laborFormData, name: e.target.value })}
              placeholder="인력 구분 표시 이름"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">
              상세 설명
            </label>
            <textarea
              value={laborFormData.description}
              onChange={(e) => setLaborFormData({ ...laborFormData, description: e.target.value })}
              placeholder="해당 인력 노드에 대한 상세 메타정보를 입력하세요"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                setIsAddLaborModalOpen(false);
                setIsEditLaborModalOpen(false);
                setEditingLabor(null);
                setLaborFormData({ id: "", name: "", description: "" });
              }}
              className="h-10 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSaveLabor}
              disabled={!laborFormData.name || (!isEditLaborModalOpen && !laborFormData.id)}
              className="h-10 px-8 rounded-md bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:translate-y-0"
            >
              저장
            </button>
          </div>
        </div>
      </DraggablePanel>
    </div >
  );
}
