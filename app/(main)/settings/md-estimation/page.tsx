"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// ── AutoResizeTextarea ─────────────────────────────────────────────────────────
function AutoResizeTextarea({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
                const el = e.target;
                el.style.height = "0px";
                el.style.height = `${el.scrollHeight}px`;
            }}
            placeholder={placeholder}
            className={className}
            style={{ minHeight: "35px", overflow: "hidden" }}
        />
    );
}

// ── NumberInput ──────────────────────────────────────────────────────────────
function NumberInput({
    value,
    onChange,
    className,
    placeholder,
    step = 0.5,
    min = 0,
}: {
    value: number;
    onChange: (v: number) => void;
    className?: string;
    placeholder?: string;
    step?: number;
    min?: number;
}) {
    const [localValue, setLocalValue] = useState(value !== undefined && value !== null ? Number(value).toFixed(2) : "");

    useEffect(() => {
        setLocalValue(value !== undefined && value !== null ? Number(value).toFixed(2) : "");
    }, [value]);

    return (
        <input
            type="number"
            min={min}
            step={step}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                const parsed = parseFloat(localValue);
                if (!isNaN(parsed)) {
                    onChange(parsed);
                    setLocalValue(parsed.toFixed(2));
                } else {
                    onChange(0);
                    setLocalValue("0.00");
                }
            }}
            className={className}
            style={{ height: "100%", minHeight: "35px" }}
            placeholder={placeholder}
        />
    );
}

// ── 타입 ───────────────────────────────────────────────────────────────────────
interface MdItem {
    id: number;
    itemCategory?: string;
    classification?: string;
    content: string;
    description?: string;
    standardMd: number;
}

interface MdCategory {
    id: number;
    code: string;
    name: string;
    overallWeight: number;
    items: MdItem[];
}

// ── 컴포넌트 ───────────────────────────────────────────────────────────────────
export default function MdEstimationSettingsPage() {
    const [activeTab, setActiveTab] = useState<string>("");
    const { showToast, confirm } = useToast();
    const [categories, setCategories] = useState<MdCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch("/api/settings/md-estimation");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                    setActiveTab(data.categories[0]?.code ?? "");
                }
            } catch (e) {
                console.error("md-estimation load error:", e);
                showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const activeCategory = categories.find((c) => c.code === activeTab);

    const updateItem = useCallback(
        (catCode: string, itemId: number, field: keyof MdItem, value: string | number) => {
            setCategories((prev) =>
                prev.map((cat) =>
                    cat.code !== catCode
                        ? cat
                        : { ...cat, items: cat.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)) }
                )
            );
        },
        []
    );

    const addItem = (catCode: string) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.code !== catCode
                    ? cat
                    : {
                        ...cat,
                        items: [
                            ...cat.items,
                            { id: Date.now(), classification: "", itemCategory: "", content: "", description: "", standardMd: 0 },
                        ],
                    }
            )
        );
    };

    const deleteItem = (catCode: string, itemId: number) => {
        confirm({
            title: "항목 삭제",
            message: "이 항목을 삭제하시겠습니까?",
            onConfirm: () => {
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat.code !== catCode ? cat : { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
                    )
                );
                showToast("항목이 삭제되었습니다.", "success");
            },
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/md-estimation", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories }),
            });
            if (!res.ok) throw new Error("save failed");
            showToast("저장되었습니다.", "success");
        } catch (e) {
            console.error(e);
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">데이터를 불러오고 있습니다...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between px-2">
                <div>
                    <div className="h-10 flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">M/D 산정 항목 관리</h1>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
                        VRB 심의에 사용되는 M/D 산정 항목과 기준 M/D를 관리합니다.
                    </p>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {categories
                        .filter((cat) => !cat.code.endsWith("_weight")) // 가중치 전용 카테고리는 탭에서 제외
                        .map((cat) => (
                            <button
                                key={cat.code}
                                onClick={() => setActiveTab(cat.code)}
                                className={cn(
                                    "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                                    activeTab === cat.code
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                </nav>
            </div>

            {/* 탭 컨텐츠 */}
            {activeCategory && (
                <div className="neo-light-card border border-border/40 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* 카드 상단 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{activeCategory.name}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "저장 중..." : "저장"}
                                </button>
                            </div>
                        </div>




                        {/* 3D 모델링 / P&ID 탭: 단일 가중치 테이블 */}
                        {(activeCategory.code === "modeling3d" || activeCategory.code === "pid") && (() => {
                            const weightCatCode = `${activeCategory.code}_weight`;
                            const weightCategory = categories.find((c) => c.code === weightCatCode);
                            if (!weightCategory) return null;
                            return (
                                <div className="mt-6 mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {weightCategory.name}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto shadow-sm">
                                        <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                                            <colgroup>
                                                <col style={{ width: "40px" }} />
                                                <col style={{ width: "200px" }} />
                                                <col />
                                                <col style={{ width: "100px" }} />
                                                <col style={{ width: "52px" }} />
                                            </colgroup>
                                            <thead>
                                                <tr className="h-[35px]">
                                                    <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">No</th>
                                                    <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left text-sm font-bold">항목명</th>
                                                    <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left text-sm font-bold">설명</th>
                                                    <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">가중치</th>
                                                    <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">삭제</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {weightCategory.items.map((item, idx) => (
                                                    <tr key={item.id} className="group">
                                                        <td className="border border-gray-300 p-0 bg-gray-50/50 text-center text-sm text-gray-500" style={{ verticalAlign: "middle" }}>
                                                            {idx + 1}
                                                        </td>
                                                        <td className="border border-gray-300 p-0" style={{ verticalAlign: "top" }}>
                                                            <AutoResizeTextarea
                                                                value={item.content || ""}
                                                                onChange={(v) => updateItem(weightCategory.code, item.id, "content", v)}
                                                                className="w-full border-none bg-transparent px-[10px] py-[8px] text-sm text-gray-700 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors resize-none block"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-300 p-0" style={{ verticalAlign: "top" }}>
                                                            <AutoResizeTextarea
                                                                value={item.description || ""}
                                                                onChange={(v) => updateItem(weightCategory.code, item.id, "description", v)}
                                                                className="w-full border-none bg-transparent px-[10px] py-[8px] text-sm text-gray-500 leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors resize-none block"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                            <NumberInput
                                                                step={0.05}
                                                                value={item.standardMd}
                                                                onChange={(val) => updateItem(weightCategory.code, item.id, "standardMd", val)}
                                                                className="w-full border-none bg-transparent px-[10px] text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-300 p-0 text-center" style={{ verticalAlign: "top" }}>
                                                            <div className="h-[35px] flex items-center justify-center">
                                                                <button
                                                                    onClick={() => deleteItem(weightCategory.code, item.id)}
                                                                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                    title="삭제"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan={5} className="border border-gray-300 p-0">
                                                        <button
                                                            onClick={() => addItem(weightCategory.code)}
                                                            className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            항목 추가
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 제목 및 테이블 영역 (기존 공수 항목) */}
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {activeCategory.name === "개발" ? "개발 공수 기준표" : activeCategory.name + " 공수 기준표"}
                            </h3>
                        </div>

                        {/* 테이블 */}
                        <div className="overflow-x-auto shadow-sm">
                            <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                                <colgroup>
                                    <col style={{ width: "40px" }} />
                                    <col style={{ width: "200px" }} />
                                    <col />
                                    <col style={{ width: "100px" }} />
                                    <col style={{ width: "52px" }} />
                                </colgroup>
                                <thead>
                                    <tr className="h-[35px]">
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">No</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">분류</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left text-sm font-bold">항목명</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">기준 M/D</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCategory.items.map((item, idx) => (
                                        <tr key={item.id} className="group">
                                            {/* No */}
                                            <td className="border border-gray-300 p-0 bg-gray-50/50 text-center text-sm text-gray-500" style={{ verticalAlign: "middle" }}>
                                                {idx + 1}
                                            </td>
                                            {/* 분류 */}
                                            <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                <input
                                                    type="text"
                                                    value={item.classification || ""}
                                                    onChange={(e) => updateItem(activeCategory.code, item.id, "classification", e.target.value)}
                                                    className="w-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block"
                                                    style={{ height: "100%", minHeight: "35px" }}
                                                    placeholder="분류 입력"
                                                />
                                            </td>
                                            {/* 항목명 */}
                                            <td className="border border-gray-300 p-0" style={{ verticalAlign: "top" }}>
                                                <AutoResizeTextarea
                                                    value={item.content || ""}
                                                    onChange={(v) => updateItem(activeCategory.code, item.id, "content", v)}
                                                    placeholder="항목명 입력"
                                                    className="w-full border-none bg-transparent px-[10px] py-[8px] text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors resize-none block"
                                                />
                                            </td>
                                            {/* 기준 M/D */}
                                            <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                <NumberInput
                                                    min={0}
                                                    step={0.5}
                                                    value={item.standardMd}
                                                    onChange={(val) => updateItem(activeCategory.code, item.id, "standardMd", val)}
                                                    className="w-full border-none bg-transparent px-[10px] text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            {/* 삭제 */}
                                            <td className="border border-gray-300 p-0 text-center" style={{ verticalAlign: "top" }}>
                                                <div className="h-[35px] flex items-center justify-center">
                                                    <button
                                                        onClick={() => deleteItem(activeCategory.code, item.id)}
                                                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                        title="삭제"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* 행 추가 */}
                                    <tr>
                                        <td colSpan={5} className="border border-gray-300 p-0">
                                            <button
                                                onClick={() => addItem(activeCategory.code)}
                                                className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                                            >
                                                <Plus className="h-4 w-4" />
                                                항목 추가
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


