"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export interface Product {
  id: number;
  companyName: string;
  productName: string;
  unitPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductMasterProps {
  /** 상단 제목/설명과 외곽 여백까지 전체 페이지 형태로 렌더링할지 여부 */
  fullPage?: boolean;
  /** 외부에서 신규 등록 버튼을 눌렀을 때 모달을 열기 위한 트리거 값 (증가형 카운터 등) */
  externalNewTrigger?: number;
}

export function ProductMaster({ fullPage = true, externalNewTrigger }: ProductMasterProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [unitPriceInput, setUnitPriceInput] = useState<string>("");
  const [lastExternalTrigger, setLastExternalTrigger] = useState<number | undefined>(
    externalNewTrigger
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  // 기준단가표 화면 등에서 외부 버튼으로 신규 등록 요청 시 모달 오픈
  useEffect(() => {
    if (
      externalNewTrigger !== undefined &&
      externalNewTrigger !== lastExternalTrigger
    ) {
      openNewForm();
      setLastExternalTrigger(externalNewTrigger);
    }
  }, [externalNewTrigger, lastExternalTrigger]);

  useEffect(() => {
    const s = search.trim().toLowerCase();
    if (!s) {
      setFiltered(products);
      return;
    }
    setFiltered(
      products.filter(
        (p) =>
          p.companyName.toLowerCase().includes(s) ||
          p.productName.toLowerCase().includes(s)
      )
    );
  }, [products, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) {
        console.error("Failed to fetch products");
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const openNewForm = () => {
    setEditing(null);
    setForm({ companyName: "", productName: "", unitPrice: 0, isActive: true });
    setUnitPriceInput("");
  };

  const openEditForm = (product: Product) => {
    setEditing(product);
    setForm({
      id: product.id,
      companyName: product.companyName,
      productName: product.productName,
      unitPrice: product.unitPrice,
      isActive: product.isActive,
    });
    setUnitPriceInput(
      product.unitPrice != null ? product.unitPrice.toLocaleString() : ""
    );
  };

  const closeForm = () => {
    setEditing(null);
    setForm({});
    setUnitPriceInput("");
  };

  const handleSave = async () => {
    if (!form.companyName || !form.productName) {
      alert("업체명과 제품명을 입력해 주세요.");
      return;
    }

    const parsedUnitPrice =
      unitPriceInput.trim() === ""
        ? 0
        : Number(unitPriceInput.replace(/,/g, ""));
    if (Number.isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      alert("단가(천원)는 0 이상 숫자로 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);
      const isEdit = !!form.id;
      const url = isEdit ? `/api/products/${form.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          productName: form.productName,
          unitPrice: parsedUnitPrice,
          isActive: form.isActive ?? true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to save product", data);
        alert("제품/상품 저장에 실패했습니다.");
        return;
      }
      await fetchProducts();
      closeForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("제품/상품 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !window.confirm(
        `제품/상품을 삭제하시겠습니까?\n\n${product.companyName} - ${product.productName}`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to delete product", data);
        alert("제품/상품 삭제에 실패했습니다.");
        return;
      }
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("제품/상품 삭제 중 오류가 발생했습니다.");
    }
  };

  const content = (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 헤더 (단독 메뉴에서만 사용) */}
      {fullPage && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
              <Search className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">제품 단가 마스터</h1>
              <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
                제품 및 서비스 단가 관리
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            신규 제품 등록
          </button>
        </div>
      )}

      {/* 검색 바 - Neo Modern Style */}
      <div className="flex items-center gap-4 px-2">
        <div className="relative group w-full max-w-md">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="업체명 또는 제품명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-muted/20 border-transparent py-4 pl-12 pr-6 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* 제품 목록 테이블 */}
      <div className="overflow-hidden bg-white/40 backdrop-blur-sm rounded-[2rem] border border-border/40 shadow-sm animate-in zoom-in-95 duration-500">
        <div className="overflow-x-auto custom-scrollbar-main">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/20">
                <tr className="bg-muted/30 border-b border-border/20">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    업체명
                  </th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    제품명
                  </th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    단가 (천원)
                  </th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    사용여부
                  </th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    작업
                  </th>
                </tr>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-bold text-muted-foreground animate-pulse tracking-widest uppercase">데이터를 불러오고 있습니다...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Search className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-black uppercase tracking-widest italic">데이터가 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Plus className="h-3 w-3 rotate-45" />
                        </div>
                        <span className="font-bold text-foreground truncate">{p.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{p.productName}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-mono font-black text-foreground">{p.unitPrice.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-tighter ${p.isActive
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        {p.isActive ? "사용중" : "미사용"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          type="button"
                          onClick={() => openEditForm(p)}
                          className="p-2 rounded-xl bg-white border border-border/40 hover:border-primary/40 hover:text-primary transition-all shadow-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-2 rounded-xl bg-white border border-border/40 hover:border-destructive/40 hover:text-destructive transition-all shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 - Neo Integrated Design */}
      {(form.companyName !== undefined || form.productName !== undefined) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={closeForm} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] border border-white shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-border/30 px-10 py-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${editing ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600 rotate-12'}`}>
                  {editing ? <Pencil className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">
                    {editing ? "제품/상품 수정" : "신규 제품 등록"}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">제품 정보 관리</p>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-2.5 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-primary">업체명</label>
                <input
                  type="text"
                  value={form.companyName ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  placeholder="제조사 또는 원천사 입력"
                  className="w-full rounded-2xl bg-muted/20 border-transparent py-4 px-6 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2.5 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-primary">제품명</label>
                <input
                  type="text"
                  value={form.productName ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, productName: e.target.value }))
                  }
                  placeholder="정식 모델명 또는 서비스 명칭 입력"
                  className="w-full rounded-2xl bg-muted/20 border-transparent py-4 px-6 text-sm font-bold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2.5 group">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-primary">단가 (천원)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={unitPriceInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (raw === "") {
                        setUnitPriceInput("");
                        return;
                      }
                      const num = Number(raw);
                      if (Number.isNaN(num)) return;
                      setUnitPriceInput(num.toLocaleString());
                    }}
                    placeholder="0"
                    className="w-full rounded-2xl bg-muted/20 border-transparent py-4 px-12 text-sm font-mono font-black text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-right"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs opacity-40">₩</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/10 border border-border/20">
                <input
                  id="product-active"
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-5 w-5 rounded-lg border-border/40 text-primary focus:ring-primary/20 transition-all"
                />
                <label
                  htmlFor="product-active"
                  className="text-[11px] font-black text-foreground uppercase tracking-widest cursor-pointer select-none"
                >
                  사용 여부 활성화
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-2xl border border-border/40 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-all active:scale-95 px-6"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] rounded-2xl bg-primary py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-30 px-6"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return content;
}

