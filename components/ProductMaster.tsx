"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  SearchInput,
  DraggablePanel,
} from "@/components/ui";
import { Save, X } from "lucide-react";

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
  /** 외부 트리거 시 사용할 위치 정보 */
  externalTriggerRect?: DOMRect | null;
}
export function ProductMaster({
  fullPage = true,
  externalNewTrigger,
  externalTriggerRect
}: ProductMasterProps) {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  // 기준단가표 화면 등에서 외부 버튼으로 신규 등록 요청 시 모달 오픈
  useEffect(() => {
    if (
      externalNewTrigger !== undefined &&
      externalNewTrigger !== lastExternalTrigger
    ) {
      if (externalTriggerRect) setTriggerRect(externalTriggerRect);
      openNewForm();
      setLastExternalTrigger(externalNewTrigger);
    }
  }, [externalNewTrigger, lastExternalTrigger, externalTriggerRect]);

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

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const openNewForm = (rect?: DOMRect) => {
    if (rect) setTriggerRect(rect);
    setEditing(null);
    setForm({ companyName: "", productName: "", unitPrice: 0, isActive: true });
    setUnitPriceInput("");
  };

  const openEditForm = (product: Product, e: React.MouseEvent) => {
    setTriggerRect(e.currentTarget.getBoundingClientRect());
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
    <div className="space-y-8">
      {/* 헤더 (단독 메뉴에서만 사용) */}
      {fullPage && (
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">제품 단가 마스터</h1>
          </div>
          <Button
            onClick={(e) => openNewForm(e.currentTarget.getBoundingClientRect())}
            variant="primary"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            제품 등록
          </Button>
        </div>
      )}

      {/* 검색 바 - Neo Modern Style */}
      <div className="flex items-center gap-x-4 mx-1">
        <SearchInput
          placeholder="업체명 또는 제품명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 제품 목록 테이블 */}
      <div className="neo-light-card overflow-hidden border border-border/40">
        <div className="overflow-x-auto custom-scrollbar-main">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">업체명</TableHead>
                <TableHead className="px-8 py-3 text-left text-sm text-slate-900">제품명</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">단가 (천원)</TableHead>
                <TableHead className="px-8 py-3 text-center text-sm text-slate-900">사용여부</TableHead>
                <TableHead className="px-8 py-3 text-right text-sm text-slate-900">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/10">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-8 py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-8 py-24 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-medium text-foreground">데이터가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <TableCell className="px-8 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-900 truncate">{p.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-3">
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{p.productName}</span>
                    </TableCell>
                    <TableCell className="px-8 py-3 text-right">
                      <span className="font-mono text-sm text-slate-900">{p.unitPrice.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="px-8 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] tracking-tighter ${p.isActive
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        {p.isActive ? "사용중" : "미사용"}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={(e) => openEditForm(p, e)}
                          className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
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
        <div className="bg-muted/30 px-8 py-5 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500">TOTAL : <span className="text-primary ml-1">{filtered.length}</span></div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs transition-all",
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
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 등록/수정 패널 */}
      <DraggablePanel
        open={(form.companyName !== undefined || form.productName !== undefined)}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        triggerRect={triggerRect}
        title={editing ? "제품 정보 수정" : "신규 제품 등록"}
        description="기관별, 직군별 기준 인력 단가를 설정하고 관리합니다."
        className="max-w-2xl"
      >
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                제조사/원천사 <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={form.companyName ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, companyName: e.target.value }))
                }
                placeholder="제조사 또는 원천사 입력"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                제품명 <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={form.productName ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productName: e.target.value }))
                }
                placeholder="정식 모델명 또는 서비스 명칭 입력"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">
                단가 (천원)
              </label>
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
                  className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-sm font-mono font-black text-foreground focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs opacity-40">₩</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/20">
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
                className="text-xs font-bold text-foreground cursor-pointer select-none"
              >
                현재 제품/상품을 활성화하여 사용합니다
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={closeForm}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving} className="px-8 min-w-[120px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "저장 중..." : (editing ? "변경사항 저장" : "제품 등록")}
            </Button>
          </div>
        </div>
      </DraggablePanel>
    </div>
  );

  return content;
}

