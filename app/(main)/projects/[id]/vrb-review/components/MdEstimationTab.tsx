"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Save, Calculator, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface MdItem {
    id: number;
    classification: string;
    content: string;
    standardMd: number;
    description?: string;
}

interface MdCategory {
    id: number;
    code: string;
    name: string;
    items: MdItem[];
}

interface QuantityMap { [itemId: number]: number; }

// 개발 탭 VRB 전용 추가 항목
interface ExtraItem {
    tempId: number;   // 클라이언트 임시키 (저장 후 id로 대체)
    id?: number;      // DB에 저장된 실제 id
    classification: string;
    content: string;
    standardMd: number;
}

// ── 공통 열 너비 (모든 테이블 동일 적용) ─────────────────────────────────────
// col1 = No / 선택  col2 = 분류 / 항목명(weight)
const COL1_W = "44px";
const COL2_W = "130px";

// ── 수량 입력 ─────────────────────────────────────────────────────────────────
function QuantityInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean; }) {
    const [local, setLocal] = useState(value > 0 ? String(value) : "");
    useEffect(() => { setLocal(value > 0 ? String(value) : ""); }, [value]);
    return (
        <input
            type="number" min={0} step={1} value={local} disabled={disabled}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => { const v = Math.max(0, parseFloat(local) || 0); onChange(v); setLocal(v > 0 ? String(v) : ""); }}
            placeholder="0"
            className={cn(
                "w-full border-none bg-transparent px-3 text-sm text-right font-mono text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white",
                !disabled && "hover:bg-indigo-50",
                "transition-colors block [appearance:textfield]",
                "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                disabled && "opacity-50"
            )}
            style={{ height: "100%", minHeight: "36px" }}
        />
    );
}

// ── 인라인 텍스트 입력 ────────────────────────────────────────────────────────
function InlineInput({ value, onChange, placeholder, align = "left" }: { value: string; onChange: (v: string) => void; placeholder?: string; align?: "left" | "right"; }) {
    return (
        <input
            type="text" value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
                "w-full border-none bg-transparent px-3 text-sm text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white",
                "hover:bg-blue-50 transition-colors block placeholder:text-gray-400",
                align === "right" && "text-right font-mono"
            )}
            style={{ height: "100%", minHeight: "36px" }}
        />
    );
}

// ── 가중치 선택 ───────────────────────────────────────────────────────────────
function WeightSelector({ weightCategory, selectedWeightId, onSelect, disabled }: {
    weightCategory: MdCategory; selectedWeightId: number | null; onSelect: (id: number) => void; disabled?: boolean;
}) {
    if (!weightCategory?.items.length) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-indigo-400" />
                <span className="text-sm font-bold text-gray-800">{weightCategory.name}</span>
                <span className="text-xs text-gray-400">· 항목 클릭으로 선택, 재클릭 시 해제</span>
            </div>
            <div className="overflow-x-auto bg-white shadow-sm">
                <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                    <colgroup>
                        <col style={{ width: COL1_W }} />
                        <col style={{ width: COL2_W }} />
                        <col />
                        <col style={{ width: "100px" }} />
                    </colgroup>
                    <thead>
                        <tr className="h-[35px] bg-slate-50">
                            <th className="border border-gray-200 px-3 text-center text-sm font-bold text-gray-700">선택</th>
                            <th className="border border-gray-200 px-3 text-left text-sm font-bold text-gray-700">항목명</th>
                            <th className="border border-gray-200 px-3 text-left text-sm font-bold text-gray-700">설명</th>
                            <th className="border border-gray-200 px-3 text-center text-sm font-bold text-gray-700">가중치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weightCategory.items.map((item) => {
                            const isSelected = selectedWeightId === item.id;
                            return (
                                <tr key={item.id} onClick={() => !disabled && onSelect(item.id)}
                                    className={cn("h-[36px] transition-colors",
                                        isSelected ? "bg-indigo-50" : "bg-white hover:bg-gray-50",
                                        !disabled && "cursor-pointer"
                                    )}
                                >
                                    <td className="border border-gray-200 px-3 text-center" style={{ verticalAlign: "middle" }}>
                                        <div className={cn("w-4 h-4 rounded-full border-2 mx-auto flex items-center justify-center",
                                            isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                                        )}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </td>
                                    <td className="border border-gray-200 px-3" style={{ verticalAlign: "middle" }}>
                                        <span className={cn("text-sm font-medium truncate block", isSelected ? "text-indigo-800" : "text-gray-800")}>{item.content}</span>
                                    </td>
                                    <td className="border border-gray-200 px-3" style={{ verticalAlign: "middle" }}>
                                        <span className="text-sm text-gray-500 truncate block">{item.description || "-"}</span>
                                    </td>
                                    <td className="border border-gray-200 px-3 text-center" style={{ verticalAlign: "middle" }}>
                                        <span className={cn("text-sm font-bold font-mono whitespace-nowrap", isSelected ? "text-indigo-700" : "text-gray-700")}>× {item.standardMd.toFixed(2)}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── 카테고리 아코디언 ─────────────────────────────────────────────────────────
function CategoryAccordion({ category, quantities, onQuantityChange, isOpen, onToggle, disabled,
    weightCategory, selectedWeightId, onWeightSelect,
    extraItems, extraQuantities, onAddExtra, onUpdateExtra, onDeleteExtra, onExtraQtyChange,
}: {
    category: MdCategory; quantities: QuantityMap; onQuantityChange: (id: number, qty: number) => void;
    isOpen: boolean; onToggle: () => void; disabled?: boolean;
    weightCategory?: MdCategory | null; selectedWeightId?: number | null; onWeightSelect?: (id: number) => void;
    extraItems?: ExtraItem[]; extraQuantities?: Record<number, number>;
    onAddExtra?: () => void; onUpdateExtra?: (tempId: number, field: keyof ExtraItem, value: string | number) => void;
    onDeleteExtra?: (tempId: number) => void; onExtraQtyChange?: (tempId: number, qty: number) => void;
}) {
    const selectedWeight = weightCategory?.items.find((i) => i.id === selectedWeightId)?.standardMd ?? null;
    const hasWeight = !!weightCategory?.items.length;

    const calcMd = category.items.reduce((s, item) => s + (quantities[item.id] || 0) * item.standardMd, 0);
    const extraCalcMd = (extraItems || []).reduce((s, item) => s + (extraQuantities?.[item.tempId] || 0) * item.standardMd, 0);
    const totalCalcMd = calcMd + extraCalcMd;
    const finalMd = selectedWeight !== null ? totalCalcMd * selectedWeight : totalCalcMd;

    const enteredCount = category.items.filter((i) => (quantities[i.id] || 0) > 0).length
        + (extraItems || []).filter((i) => (extraQuantities?.[i.tempId] || 0) > 0).length;
    const totalCount = category.items.length + (extraItems?.length || 0);
    const mdColumnLabel = hasWeight && selectedWeight !== null ? "최종 M/D" : "산정 M/D";
    const hasExtra = !!onAddExtra;

    return (
        <div id={`accordion-${category.code}`} className="border border-gray-200 rounded-xl overflow-hidden scroll-mt-20">
            <button type="button" onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50/80 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                    <span className="text-sm font-bold text-gray-900">{category.name}</span>
                    <span className="text-sm text-gray-500 font-medium">({enteredCount}/{totalCount}개 입력됨)</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasWeight && selectedWeight !== null && (
                        <span className="text-xs font-medium text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full whitespace-nowrap">× {selectedWeight.toFixed(2)}</span>
                    )}
                    <span className="text-sm font-black text-indigo-700 font-mono whitespace-nowrap">
                        {finalMd.toFixed(2)}<span className="text-xs font-bold text-indigo-400 ml-1">{hasWeight ? "최종M/D" : "M/D"}</span>
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 px-5 pt-4 pb-5 bg-gray-50/30 space-y-4">
                    {/* 가중치 (상단) */}
                    {hasWeight && weightCategory && onWeightSelect && (
                        <WeightSelector weightCategory={weightCategory} selectedWeightId={selectedWeightId ?? null} onSelect={onWeightSelect} disabled={disabled} />
                    )}

                    {/* 공수 기준표 */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 rounded-full bg-indigo-400" />
                            <span className="text-sm font-bold text-gray-800">{category.name} 공수 기준표</span>
                        </div>
                        <div className="overflow-x-auto bg-white shadow-sm">
                            <table className="min-w-full" style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: COL1_W }} />
                                    <col style={{ width: COL2_W }} />
                                    <col />
                                    <col style={{ width: "90px" }} />
                                    <col style={{ width: "100px" }} />
                                    <col style={{ width: "110px" }} />
                                    {hasExtra && <col style={{ width: "36px" }} />}
                                </colgroup>
                                <thead>
                                    <tr className="h-[35px] bg-slate-50">
                                        <th className="border border-gray-200 px-3 text-center text-sm font-bold text-gray-700 whitespace-nowrap">No</th>
                                        <th className="border border-gray-200 px-3 text-left text-sm font-bold text-gray-700 whitespace-nowrap">분류</th>
                                        <th className="border border-gray-200 px-3 text-left text-sm font-bold text-gray-700 whitespace-nowrap">항목명</th>
                                        <th className="border border-gray-200 px-3 text-right text-sm font-bold text-gray-700 whitespace-nowrap">기준 M/D</th>
                                        <th className="border border-gray-200 px-3 text-right text-sm font-bold text-gray-700 whitespace-nowrap">수량</th>
                                        <th className={cn("border border-gray-200 px-3 text-right text-sm font-bold whitespace-nowrap",
                                            hasWeight && selectedWeight !== null ? "text-indigo-700 bg-indigo-50/60" : "text-gray-700 bg-indigo-50/30"
                                        )}>{mdColumnLabel}</th>
                                        {hasExtra && <th className="border border-gray-200" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 기존 항목 */}
                                    {category.items.map((item, idx) => {
                                        const qty = quantities[item.id] || 0;
                                        const calcItemMd = qty * item.standardMd;
                                        const dispMd = selectedWeight !== null ? calcItemMd * selectedWeight : calcItemMd;
                                        return (
                                            <tr key={item.id} className={cn("h-[36px] transition-colors", qty > 0 ? "bg-indigo-50/20" : "bg-white")}>
                                                <td className="border border-gray-200 px-3 text-center text-sm text-gray-500 whitespace-nowrap" style={{ verticalAlign: "middle" }}>{idx + 1}</td>
                                                <td className="border border-gray-200 px-3 overflow-hidden" style={{ verticalAlign: "middle", maxWidth: COL2_W }}>
                                                    <span className="text-sm text-gray-500 truncate block whitespace-nowrap">{item.classification || "-"}</span>
                                                </td>
                                                <td className="border border-gray-200 px-3 overflow-hidden" style={{ verticalAlign: "middle" }}>
                                                    <span className="text-sm font-medium text-gray-800 truncate block whitespace-nowrap">{item.content}</span>
                                                </td>
                                                <td className="border border-gray-200 px-3 text-right whitespace-nowrap" style={{ verticalAlign: "middle" }}>
                                                    <span className="text-sm font-mono text-gray-600">{item.standardMd.toFixed(1)}</span>
                                                </td>
                                                <td className="border border-gray-200 p-0" style={{ verticalAlign: "middle", lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                    <QuantityInput value={qty} onChange={(v) => onQuantityChange(item.id, v)} disabled={disabled} />
                                                </td>
                                                <td className={cn("border border-gray-200 px-3 text-right whitespace-nowrap", hasWeight ? "bg-indigo-50/30" : "bg-indigo-50/20")} style={{ verticalAlign: "middle" }}>
                                                    <span className={cn("text-sm font-bold font-mono", dispMd > 0 ? "text-indigo-700" : "text-gray-300")}>
                                                        {dispMd > 0 ? dispMd.toFixed(2) : "-"}
                                                    </span>
                                                </td>
                                                {hasExtra && <td className="border border-gray-200" />}
                                            </tr>
                                        );
                                    })}

                                    {/* 추가 항목 (개발 탭 전용) */}
                                    {(extraItems || []).map((item, idx) => {
                                        const qty = extraQuantities?.[item.tempId] || 0;
                                        const calcItemMd = qty * item.standardMd;
                                        return (
                                            <tr key={`extra-${item.tempId}`} className="h-[36px] bg-blue-50/30 transition-colors">
                                                <td className="border border-gray-200 px-3 text-center text-sm text-gray-400 whitespace-nowrap" style={{ verticalAlign: "middle" }}>
                                                    {category.items.length + idx + 1}
                                                </td>
                                                <td className="border border-gray-200 p-0" style={{ verticalAlign: "middle", lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                    <InlineInput value={item.classification} onChange={(v) => onUpdateExtra?.(item.tempId, "classification", v)} placeholder="분류" />
                                                </td>
                                                <td className="border border-gray-200 p-0" style={{ verticalAlign: "middle", lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                    <InlineInput value={item.content} onChange={(v) => onUpdateExtra?.(item.tempId, "content", v)} placeholder="항목명 입력" />
                                                </td>
                                                <td className="border border-gray-200 p-0" style={{ verticalAlign: "middle", lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                    <input
                                                        type="number" min={0} step={0.5} value={item.standardMd || ""}
                                                        onChange={(e) => onUpdateExtra?.(item.tempId, "standardMd", parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                        className="w-full border-none bg-transparent px-3 text-sm text-right font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        style={{ height: "100%", minHeight: "36px" }}
                                                    />
                                                </td>
                                                <td className="border border-gray-200 p-0" style={{ verticalAlign: "middle", lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                    <QuantityInput value={qty} onChange={(v) => onExtraQtyChange?.(item.tempId, v)} />
                                                </td>
                                                <td className="border border-gray-200 px-3 text-right bg-indigo-50/20 whitespace-nowrap" style={{ verticalAlign: "middle" }}>
                                                    <span className={cn("text-sm font-bold font-mono", calcItemMd > 0 ? "text-indigo-700" : "text-gray-300")}>
                                                        {calcItemMd > 0 ? calcItemMd.toFixed(2) : "-"}
                                                    </span>
                                                </td>
                                                <td className="border border-gray-200 p-0 text-center" style={{ verticalAlign: "middle" }}>
                                                    <button onClick={() => onDeleteExtra?.(item.tempId)}
                                                        className="w-full h-[36px] flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* 소계 행 */}
                                    <tr className="h-[35px] bg-slate-50">
                                        <td colSpan={hasExtra ? 5 : 5} className="border border-gray-200 px-3 text-right text-sm font-bold text-gray-700 py-2 whitespace-nowrap">
                                            {hasWeight && selectedWeight !== null ? `소계 (×${selectedWeight.toFixed(2)})` : "소계"}
                                        </td>
                                        <td className={cn("border border-gray-200 px-3 text-right py-2 whitespace-nowrap", hasWeight ? "bg-indigo-100/60" : "bg-indigo-50/60")}>
                                            <span className="text-sm font-black text-indigo-700 font-mono">
                                                {finalMd.toFixed(2)}<span className="text-xs font-bold text-indigo-400 ml-1">M/D</span>
                                            </span>
                                        </td>
                                        {hasExtra && <td className="border border-gray-200" />}
                                    </tr>
                                </tbody>
                            </table>

                            {/* 항목 추가 버튼 */}
                            {onAddExtra && !disabled && (
                                <button onClick={onAddExtra}
                                    className="w-full h-[36px] flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium border border-gray-200 border-t-0">
                                    <Plus className="h-4 w-4" />항목 추가
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function MdEstimationTab({ projectId, vrbStatus }: { projectId: string; vrbStatus?: string; }) {
    const { showToast } = useToast();
    const [allCategories, setAllCategories] = useState<MdCategory[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedWeightIds, setSelectedWeightIds] = useState<Record<string, number | null>>({});
    const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
    const [extraQuantities, setExtraQuantities] = useState<Record<number, number>>({});
    const [vrbId, setVrbId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);

    const isCompleted = vrbStatus === "COMPLETED";
    const regularCategories = allCategories.filter((c) => !c.code.endsWith("_weight"));
    const weightCategoryMap = allCategories.filter((c) => c.code.endsWith("_weight"))
        .reduce<Record<string, MdCategory>>((acc, cat) => { acc[cat.code.replace("_weight", "")] = cat; return acc; }, {});

    const handleCategoryToggle = (code: string) => {
        setOpenCategoryIds((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
    };
    const scrollToCategory = (code: string) => {
        setOpenCategoryIds((prev) => prev.includes(code) ? prev : [...prev, code]);
        setTimeout(() => document.getElementById(`accordion-${code}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const vrbRes = await fetch(`/api/vrb-reviews?projectId=${projectId}`);
                if (!vrbRes.ok) throw new Error("VRB 로드 실패");
                const vrbData = await vrbRes.json();
                const reviews = (vrbData.reviews || []).filter((r: any) => {
                    const rId = typeof r.project_id === "string" ? parseInt(r.project_id, 10) : Number(r.project_id);
                    return rId === parseInt(projectId, 10);
                });
                const currentVrbId: number | null = reviews.length > 0 ? reviews[0].id : null;
                setVrbId(currentVrbId);

                // 저장된 수량 먼저 로드
                const qtyRes = currentVrbId
                    ? await fetch(`/api/vrb-reviews/${currentVrbId}/md-estimation`)
                    : null;

                let usedSnapshot = false;
                let parsedQtyData: any = null;

                if (qtyRes && qtyRes.ok) {
                    parsedQtyData = await qtyRes.json();
                    const qtyData = parsedQtyData;

                    if (qtyData.hasSnapshot && (qtyData.quantities || []).length > 0) {
                        // ── 스냅샷 복원: settings API 불필요 ──
                        // saved quantities에서 카테고리/weight 구조 재구성
                        const catMap = new Map<string, MdCategory>();
                        const weightItemsMap = new Map<string, MdItem[]>(); // catCode → weight items

                        (qtyData.quantities || []).forEach((q: any) => {
                            const catCode = q.categoryCode || '';
                            if (!catCode) return;

                            // weight 항목과 일반 항목 분리 판단: content 없고 quantity==1 이면 weight선택 마커
                            const isWeightMarker = !q.content && q.quantity === 1 && q.calculatedMd === 0;
                            if (isWeightMarker) return; // 나중에 따로 처리

                            if (!catMap.has(catCode)) {
                                catMap.set(catCode, {
                                    id: q.itemId,  // 카테고리 자체 id는 임의
                                    code: catCode,
                                    name: q.categoryName || catCode,
                                    items: [],
                                });
                            }
                            catMap.get(catCode)!.items.push({
                                id: q.itemId,
                                classification: q.classification || '',
                                content: q.content || '',
                                standardMd: q.standardMd || 0,
                            });
                        });

                        const snapshotCategories = Array.from(catMap.values());
                        setAllCategories(snapshotCategories);
                        const regularCats = snapshotCategories.filter((c) => !c.code.endsWith('_weight'));
                        if (regularCats.length > 0) setOpenCategoryIds([regularCats[0].code]);
                        usedSnapshot = true;
                    }

                    // 수량 맵 구성 (스냅샷 여부 무관)
                    // weight 항목 식별: content 없고 quantity==1, calculatedMd==0
                    // 하지만 스냅샷에서는 categoryCode에 '_weight' 포함
                    const qtyMap: QuantityMap = {};
                    const weightMap: Record<string, number | null> = {};

                    (qtyData.quantities || []).forEach((q: any) => {
                        const catCode: string = q.categoryCode || '';
                        if (catCode.endsWith('_weight')) {
                            const base = catCode.replace('_weight', '');
                            if (q.quantity > 0) weightMap[base] = q.itemId;
                        } else if (!(!q.content && q.quantity === 1 && q.calculatedMd === 0)) {
                            qtyMap[q.itemId] = q.quantity;
                        } else {
                            // old format: weight marker (no categoryCode)
                            // skip - can't determine base category
                        }
                    });
                    setQuantities(qtyMap);
                    setSelectedWeightIds(weightMap);

                    // 추가 항목 복원
                    if (qtyData.extraItems?.length > 0) {
                        let tempIdCounter = Date.now();
                        const restoredExtras: ExtraItem[] = qtyData.extraItems.map((e: any) => ({
                            tempId: tempIdCounter++,
                            id: e.id,
                            classification: e.classification || "",
                            content: e.content || "",
                            standardMd: e.standardMd || 0,
                        }));
                        const restoredQty: Record<number, number> = {};
                        restoredExtras.forEach((item, idx) => {
                            restoredQty[item.tempId] = qtyData.extraItems[idx].quantity || 0;
                        });
                        setExtraItems(restoredExtras);
                        setExtraQuantities(restoredQty);
                    }
                }

                if (!usedSnapshot) {
                    // ── 스냅샷 없음: settings에서 로드 ──
                    const catRes = await fetch("/api/settings/md-estimation");
                    if (catRes.ok) {
                        const catData = await catRes.json();
                        const loadedCategories: MdCategory[] = catData.categories || [];
                        setAllCategories(loadedCategories);
                        const regularCats = loadedCategories.filter((c) => !c.code.endsWith("_weight"));
                        if (regularCats.length > 0) setOpenCategoryIds([regularCats[0].code]);

                        // 저장된 수량이 있으면 (스냅샷 없이 itemId로만) 매핑
                        if (parsedQtyData) {
                            const qtyData = parsedQtyData;
                            const weightItemToBase = new Map<number, string>();
                            loadedCategories.filter((c) => c.code.endsWith("_weight")).forEach((cat) => {
                                const base = cat.code.replace("_weight", "");
                                cat.items.forEach((item) => weightItemToBase.set(item.id, base));
                            });
                            const qtyMap: QuantityMap = {};
                            const weightMap: Record<string, number | null> = {};
                            (qtyData.quantities || []).forEach((q: any) => {
                                const base = weightItemToBase.get(q.itemId);
                                if (base !== undefined) { if (q.quantity > 0) weightMap[base] = q.itemId; }
                                else { qtyMap[q.itemId] = q.quantity; }
                            });
                            setQuantities(qtyMap);
                            setSelectedWeightIds(weightMap);
                        }
                    }
                }
            } catch (e) {
                console.error("MdEstimationTab init error:", e);
                showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
            } finally { setLoading(false); }
        };
        init();
    }, [projectId]);

    const handleQuantityChange = useCallback((itemId: number, qty: number) => {
        setQuantities((prev) => ({ ...prev, [itemId]: qty }));
    }, []);
    const handleWeightSelect = useCallback((catCode: string, weightItemId: number) => {
        setSelectedWeightIds((prev) => ({ ...prev, [catCode]: prev[catCode] === weightItemId ? null : weightItemId }));
    }, []);
    const handleAddExtra = useCallback(() => {
        setExtraItems((prev) => [...prev, { tempId: Date.now(), classification: "", content: "", standardMd: 0 }]);
    }, []);
    const handleUpdateExtra = useCallback((tempId: number, field: keyof ExtraItem, value: string | number) => {
        setExtraItems((prev) => prev.map((i) => i.tempId === tempId ? { ...i, [field]: value } : i));
    }, []);
    const handleDeleteExtra = useCallback((tempId: number) => {
        setExtraItems((prev) => prev.filter((i) => i.tempId !== tempId));
        setExtraQuantities((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
    }, []);
    const handleExtraQtyChange = useCallback((tempId: number, qty: number) => {
        setExtraQuantities((prev) => ({ ...prev, [tempId]: qty }));
    }, []);

    const getCategoryFinalMd = (cat: MdCategory): number => {
        const calcMd = cat.items.reduce((s, item) => s + (quantities[item.id] || 0) * item.standardMd, 0);
        const extraCalcMd = cat.code === "development"
            ? extraItems.reduce((s, item) => s + (extraQuantities[item.tempId] || 0) * item.standardMd, 0) : 0;
        const total = calcMd + extraCalcMd;
        const weightCat = weightCategoryMap[cat.code];
        if (!weightCat) return total;
        const selectedId = selectedWeightIds[cat.code];
        if (!selectedId) return total;
        return total * (weightCat.items.find((i) => i.id === selectedId)?.standardMd ?? 1);
    };

    const totalMdByCategory = regularCategories.map((cat) => ({
        code: cat.code, name: cat.name, finalMd: getCategoryFinalMd(cat),
        hasWeight: !!weightCategoryMap[cat.code]?.items.length,
    }));
    const grandTotalMd = totalMdByCategory.reduce((s, c) => s + c.finalMd, 0);

    const handleSave = async () => {
        if (!vrbId) { showToast("VRB 심의가 아직 생성되지 않았습니다.", "error"); return; }
        setSaving(true);
        try {
            // 각 항목에 카테고리 코드/이름 + 항목 상세를 스냅샷으로 포함
            const quantitiesPayload = regularCategories.flatMap((cat) =>
                cat.items.map((item) => ({
                    itemId: item.id,
                    quantity: quantities[item.id] || 0,
                    calculatedMd: (quantities[item.id] || 0) * item.standardMd,
                    // 스냅샷
                    classification: item.classification || '',
                    content: item.content || '',
                    standardMd: item.standardMd,
                    categoryCode: cat.code,
                    categoryName: cat.name,
                }))
            );
            // 가중치 선택 상태도 categoryCode 포함 스냅샷으로 저장
            const weightPayload = Object.entries(selectedWeightIds)
                .filter(([, id]) => id !== null)
                .flatMap(([catCode]) => {
                    const weightCat = weightCategoryMap[catCode];
                    const selectedId = selectedWeightIds[catCode];
                    if (!weightCat || !selectedId) return [];
                    const wItem = weightCat.items.find((i) => i.id === selectedId);
                    if (!wItem) return [];
                    return [{
                        itemId: selectedId,
                        quantity: 1,
                        calculatedMd: 0,
                        classification: wItem.classification || '',
                        content: wItem.content || '',
                        standardMd: wItem.standardMd,
                        categoryCode: weightCat.code,
                        categoryName: weightCat.name,
                    }];
                });
            const extraPayload = extraItems.map((item) => ({
                classification: item.classification,
                content: item.content,
                standardMd: item.standardMd,
                quantity: extraQuantities[item.tempId] || 0,
                calculatedMd: (extraQuantities[item.tempId] || 0) * item.standardMd,
            }));

            const res = await fetch(`/api/vrb-reviews/${vrbId}/md-estimation`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantities: [...quantitiesPayload, ...weightPayload], extraItems: extraPayload }),
            });
            if (!res.ok) throw new Error("save failed");
            showToast("저장되었습니다.", "success");
        } catch (e) { console.error(e); showToast("저장에 실패했습니다.", "error"); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">M/D 산정 항목을 불러오고 있습니다...</p>
        </div>
    );
    if (regularCategories.length === 0) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <p className="text-base font-medium">등록된 M/D 산정 항목이 없습니다.</p>
            <p className="text-sm">설정 {">"} M/D 산정 항목 관리에서 항목을 등록해주세요.</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-2">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">예상 M/D</h2>
                        <p className="mt-1 text-sm text-gray-600">수량 입력 시 산정 M/D가 자동 계산됩니다. 3D 모델링/P&amp;ID는 가중치 선택이 최종 M/D에 반영됩니다.</p>
                    </div>
                    {!isCompleted && (
                        <button type="button" onClick={handleSave} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
                            <Save className="h-4 w-4" />{saving ? "저장 중..." : "저장"}
                        </button>
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {totalMdByCategory.map((cat) => (
                            <div key={cat.code} onClick={() => scrollToCategory(cat.code)}
                                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 gap-1.5 cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-indigo-700 transition-colors whitespace-nowrap">{cat.name}</span>
                                {cat.hasWeight && <span className="text-xs text-indigo-400 font-medium whitespace-nowrap">최종 M/D</span>}
                                <div className="flex items-center justify-center w-full pt-2 border-t border-gray-50">
                                    <span className={cn("text-base font-black font-mono", cat.finalMd > 0 ? "text-indigo-700" : "text-gray-300")}>
                                        {cat.finalMd > 0 ? cat.finalMd.toFixed(1) : "-"}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm gap-1.5">
                            <div className="flex items-center gap-1.5">
                                <Calculator className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-bold text-indigo-800 whitespace-nowrap">전체 합계</span>
                            </div>
                            <div className="flex items-center justify-center w-full pt-2 border-t border-indigo-100">
                                <span className={cn("text-xl font-black font-mono", grandTotalMd > 0 ? "text-indigo-900" : "text-indigo-300")}>
                                    {grandTotalMd > 0 ? grandTotalMd.toFixed(2) : "-"}
                                </span>
                                {grandTotalMd > 0 && <span className="text-xs font-bold text-indigo-400 ml-1 self-end mb-0.5">M/D</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border border-indigo-100/80 shadow-sm">
                        <span className="text-base font-bold text-indigo-900">총 예상 M/D</span>
                        <span className="text-3xl font-black text-indigo-950 font-mono leading-none">
                            {grandTotalMd > 0 ? grandTotalMd.toFixed(2) : "-"}
                            {grandTotalMd > 0 && <span className="text-sm font-bold text-indigo-400 ml-1">M/D</span>}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {regularCategories.map((cat) => {
                    const isDev = cat.code === "development";
                    return (
                        <CategoryAccordion key={cat.code} category={cat}
                            quantities={quantities} onQuantityChange={handleQuantityChange}
                            isOpen={openCategoryIds.includes(cat.code)} onToggle={() => handleCategoryToggle(cat.code)}
                            disabled={isCompleted}
                            weightCategory={weightCategoryMap[cat.code] ?? null}
                            selectedWeightId={selectedWeightIds[cat.code] ?? null}
                            onWeightSelect={(id) => handleWeightSelect(cat.code, id)}
                            extraItems={isDev ? extraItems : undefined}
                            extraQuantities={isDev ? extraQuantities : undefined}
                            onAddExtra={isDev ? handleAddExtra : undefined}
                            onUpdateExtra={isDev ? handleUpdateExtra : undefined}
                            onDeleteExtra={isDev ? handleDeleteExtra : undefined}
                            onExtraQtyChange={isDev ? handleExtraQtyChange : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
}
