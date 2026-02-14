"use client";

import { Save, Plus, Trash2 } from "lucide-react";
import { useProductPlan } from "@/hooks/useProductPlan";
import { formatCurrency, Currency } from "@/lib/utils/currency";
import { ProductType } from "@/types/profitability";
import { DatePicker, Button, Input, Select, Badge } from "@/components/ui";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProductPlanTabProps {
    projectId: number;
    currency: Currency;
    status: string;
    onSave?: () => void;
    profitabilityId?: number;
}

export function ProductPlanTab({ projectId, currency, status, onSave, profitabilityId }: ProductPlanTabProps) {
    const isReadOnly = status === "completed" || status === "approved" || status === "review";
    const {
        items,
        masterItems,
        loading,
        saving,
        addRow,
        deleteRow,
        updateItem,
        selectProduct,
        getSubtotal,
        getTotal,
        saveProductPlan,
    } = useProductPlan(projectId, profitabilityId);



    const internalItems = items.filter((item) => item.type === "자사");
    const externalItems = items.filter((item) => item.type === "타사");

    // Calculate margin and margin rate per item
    const calculateMargin = (item: typeof items[0]) => {
        const proposal = item.proposalPrice || 0;
        const cost = item.costPrice || 0;
        return proposal - cost;
    };

    const calculateMarginRate = (item: typeof items[0]) => {
        const proposal = item.proposalPrice || 0;
        const margin = calculateMargin(item);
        if (proposal === 0) return 0;
        return (margin / proposal) * 100;
    };

    // Calculate totals for a group
    const getGroupTotal = (groupItems: typeof items) => {
        const quantity = groupItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const unitPrice = groupItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
        const base = groupItems.reduce((sum, item) => sum + item.basePrice, 0);
        const proposal = groupItems.reduce((sum, item) => sum + (item.proposalPrice || 0), 0);
        const cost = groupItems.reduce((sum, item) => sum + (item.costPrice || 0), 0);
        const margin = proposal - cost;
        const marginRate = proposal === 0 ? 0 : (margin / proposal) * 100;

        return { quantity, unitPrice, base, proposal, cost, margin, marginRate };
    };

    const internalTotal = getGroupTotal(internalItems);
    const externalTotal = getGroupTotal(externalItems);
    const grandTotal = getGroupTotal(items);

    const formatMoney = (amount: number | null | undefined) => {
        return formatCurrency(amount || 0, currency, false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">제품 계획을 불러오는 중...</p>
            </div>
        );
    }

    const renderRows = (groupItems: typeof items, typeLabel: string) => {
        return (
            <>
                {groupItems.map((item, idx) => {
                    const margin = calculateMargin(item);
                    const marginRate = calculateMarginRate(item);
                    return (
                        <tr key={item.id} className="hover:bg-gray-50 group">
                            {idx === 0 && (
                                <td rowSpan={isReadOnly ? groupItems.length + 1 : groupItems.length + 2} className="border border-gray-300 px-2 py-2 text-center text-[14px] font-medium text-gray-900 bg-white">
                                    {typeLabel}
                                </td>
                            )}
                            <td className="border border-gray-300 px-2 py-2">
                                <input
                                    type="text"
                                    value={item.companyName}
                                    onChange={(e) => updateItem(item.id, "companyName", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full h-10 rounded-xl border border-slate-200 px-3 py-1 text-sm text-center font-bold transition-all duration-300 focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                                <div className="flex items-center gap-1">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            list={`products-${item.id}`}
                                            value={item.productName}
                                            onChange={(e) => selectProduct(item.id, e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full h-10 rounded-xl border border-slate-200 px-3 py-1 text-sm font-bold transition-all duration-300 focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 disabled:bg-slate-50 disabled:text-slate-400"
                                            placeholder="제품명"
                                        />
                                        <datalist id={`products-${item.id}`}>
                                            {masterItems.map((p) => (
                                                <option key={p.id} value={p.productName}>{p.companyName}</option>
                                            ))}
                                        </datalist>
                                    </div>
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => deleteRow(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-gray-100 transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.quantity ? item.quantity.toLocaleString() : ""}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, "");
                                        if (!isNaN(Number(val)) || val === "") {
                                            updateItem(item.id, "quantity", val === "" ? 0 : Number(val));
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    className="w-full h-10 rounded-xl border border-slate-200 px-3 py-1 text-right text-sm font-bold transition-all duration-300 focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.unitPrice ? item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ""}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, "");
                                        if (!isNaN(Number(val)) || val === "") {
                                            updateItem(item.id, "unitPrice", val === "" ? 0 : Number(val));
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    className="w-full h-10 rounded-xl border border-slate-200 px-3 py-1 text-right text-sm font-bold transition-all duration-300 focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                                {formatMoney(item.basePrice)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.proposalPrice ? item.proposalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ""}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, "");
                                        if (!isNaN(Number(val)) || val === "") {
                                            updateItem(item.id, "proposalPrice", val === "" ? 0 : Number(val));
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    className="w-full h-10 rounded-xl border-2 border-primary/20 px-3 py-1 text-right text-sm font-black text-primary transition-all duration-300 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50 disabled:text-primary/40"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-600">
                                {item.discountRate.toFixed(1)}%
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.costPrice ? item.costPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ""}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/,/g, "");
                                        if (!isNaN(Number(val)) || val === "") {
                                            updateItem(item.id, "costPrice", val === "" ? 0 : Number(val));
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    className="w-full rounded border border-gray-200 px-2 py-1 text-right text-[14px] bg-white disabled:bg-gray-50 disabled:text-gray-500"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {item.costPrice ? formatMoney(margin) : "-"}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {item.costPrice ? `${marginRate.toFixed(1)}%` : "-"}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                                <DatePicker
                                    date={item.requestDate ? new Date(item.requestDate) : undefined}
                                    setDate={(date) => updateItem(item.id, "requestDate", date ? format(date, "yyyy-MM-dd") : "")}
                                    className="w-full"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                                <select
                                    value={item.requestType}
                                    onChange={(e) => updateItem(item.id, "requestType", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full rounded border border-gray-200 px-1 py-1 text-[14px] disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    <option value="">선택</option>
                                    <option value="예정">예정</option>
                                    <option value="계약(정상)">계약(정상)</option>
                                    <option value="계약(변경)">계약(변경)</option>
                                    <option value="취소">취소</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                                {formatMoney(item.contractCostPrice)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                                {item.contractCostPrice ? formatMoney((item.proposalPrice || 0) - (item.contractCostPrice || 0)) : "-"}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                                {item.contractCostPrice && item.proposalPrice
                                    ? `${(((item.proposalPrice - item.contractCostPrice) / item.proposalPrice) * 100).toFixed(1)}%`
                                    : "-"}
                            </td>
                        </tr>
                    );
                })}
                {/* Add Row Button Row */}
                {/* Add Row Button Row */}
                {!isReadOnly && (
                    <tr>
                        {groupItems.length === 0 && (
                            <td rowSpan={2} className="border border-gray-300 px-2 py-2 text-center text-[14px] font-medium text-gray-900 bg-white">
                                {typeLabel}
                            </td>
                        )}
                        <td className="border border-gray-300 bg-white"></td>
                        <td className="border border-gray-300 px-2 py-2 bg-white">
                            <button
                                type="button"
                                onClick={() => addRow(typeLabel.includes("자사") ? "자사" : "타사")}
                                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[14px] font-medium transition-colors ${typeLabel.includes("자사")
                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <Plus className="h-4 w-4" />
                                {typeLabel} 추가
                            </button>
                        </td>
                        <td colSpan={13} className="border border-gray-300 bg-white"></td>
                    </tr>
                )}
                {/* Group Subtotal */}
                <tr className="bg-gray-100 font-medium">
                    {groupItems.length === 0 && isReadOnly && (
                        <td className="border border-gray-300 px-2 py-2 text-center text-[14px] font-medium text-gray-900 bg-white">
                            {typeLabel}
                        </td>
                    )}
                    <td colSpan={2} className="border border-gray-300 px-2 py-2 text-center text-[14px]">
                        소계
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").quantity.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").unitPrice)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").base)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-blue-600">
                        {formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").proposal)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-[14px] text-gray-900">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").discountRate.toFixed(1)}%
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-900">
                        {formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").cost)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-900">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").cost ? formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").margin) : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px] text-gray-900">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").cost ? `${getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").marginRate.toFixed(1)}%` : "-"}
                    </td>
                    <td colSpan={2} className="border border-gray-300"></td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").contractCost)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").contractCost ? formatMoney(getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").contractMargin) : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-[14px]">
                        {getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").contractCost && getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").proposal
                            ? `${((getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").contractMargin / getSubtotal(typeLabel.includes("자사") ? "자사" : "타사").proposal) * 100).toFixed(1)}%`
                            : "-"}
                    </td>
                </tr>
            </>
        );
    };

    const handleSave = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            await saveProductPlan();
            alert("제품 계획이 저장되었습니다.");
            if (onSave) onSave();
        } catch (error) {
            alert("제품 계획 저장에 실패했습니다.");
        }
    };

    const total = getTotal();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">제품 계획을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">제품 계획</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        자사/타사 제품 및 솔루션 도입 계획을 관리합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col justify-end pb-1.5 h-full">
                        <span className="text-sm text-gray-500">(단위:천원)</span>
                    </div>
                    {!isReadOnly && (
                        <button
                            type="button"
                            onClick={(e) => handleSave(e)}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "저장 중..." : "저장"}
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        {/* 최상단 타이틀 헤더 */}
                        <tr className="text-gray-900 border-b border-gray-300">
                            <th colSpan={11} className="border border-gray-300 px-4 py-1.5 text-center text-[14px] font-bold bg-blue-50/50">
                                [ 제품/상품 계획 ]
                            </th>
                            <th colSpan={5} className="border border-gray-300 px-4 py-1.5 text-center text-[14px] font-bold bg-green-50/50">
                                [ 제품/상품 발주 의뢰 ]
                            </th>
                        </tr>
                        <tr className="text-gray-900">
                            <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center text-[14px] font-bold bg-blue-50/50">구분</th>
                            <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center text-[14px] font-bold min-w-[120px] bg-blue-50/50">업체명</th>
                            <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center text-[14px] font-bold min-w-[200px] bg-blue-50/50">제품명</th>
                            <th colSpan={5} className="border border-gray-300 px-4 py-1 text-center text-[14px] font-bold bg-blue-50/50">매출</th>
                            <th colSpan={3} className="border border-gray-300 px-4 py-1 text-center text-[14px] font-bold bg-blue-50/50">매입</th>
                            <th colSpan={5} className="border border-gray-300 px-4 py-1 text-center text-[14px] font-bold bg-green-50/50">구매 계약</th>
                        </tr>
                        <tr className="text-gray-700">
                            {/* 매출 하위 */}
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium w-[60px] bg-blue-50/50">수량</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-blue-50/50">단가</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-blue-50/50">기준가</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-blue-50/50">제안가</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium w-[60px] bg-blue-50/50">할인율</th>
                            {/* 매입 하위 */}
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-blue-50/50">원가</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-blue-50/50">당사마진</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium w-[60px] bg-blue-50/50">마진율</th>
                            {/* 구매 계약 하위 */}
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[100px] bg-green-50/50">요청일</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-green-50/50">요청구분</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-green-50/50">원가</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium min-w-[80px] bg-green-50/50">당사마진</th>
                            <th className="border border-gray-300 px-2 py-1 text-center text-[14px] font-medium w-[60px] bg-green-50/50">마진율</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {renderRows(internalItems, "제품(자사)")}
                        {renderRows(externalItems, "상품(타사)")}

                        {/* Grand Total */}
                        <tr className="bg-orange-100 font-bold border-t-2 border-orange-200">
                            <td colSpan={3} className="border border-orange-300 px-4 py-3 text-center text-[14px] text-gray-900">
                                합계
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px]">
                                {grandTotal.quantity.toLocaleString()}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px]">
                                {formatMoney(grandTotal.unitPrice)}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {formatMoney(grandTotal.base)}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-blue-700">
                                {formatMoney(grandTotal.proposal)}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-center text-[14px] text-gray-900">
                                {total.discountRate.toFixed(1)}%
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {formatMoney(grandTotal.cost)}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {total.cost ? formatMoney(total.margin) : "-"}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {total.cost ? `${total.marginRate.toFixed(1)}%` : "-"}
                            </td>
                            <td colSpan={2} className="border border-orange-300 bg-orange-50"></td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {formatMoney(total.contractCost)}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {total.contractCost ? formatMoney(total.contractMargin) : "-"}
                            </td>
                            <td className="border border-orange-300 px-2 py-2 text-right text-[14px] text-gray-900">
                                {total.contractCost && total.proposal
                                    ? `${((total.contractMargin / total.proposal) * 100).toFixed(1)}%`
                                    : "-"}
                            </td>
                        </tr>
                        {/* Difference Row */}
                        <tr className="bg-blue-100 text-blue-900 font-bold">
                            <td colSpan={11} className="bg-white border-none"></td>
                            <td colSpan={2} className="border border-blue-200 px-4 py-2 text-center text-[14px]">
                                차액(제안-계약)
                            </td>
                            <td className="border border-blue-200 px-2 py-2 text-right text-[14px]">
                                {formatMoney(total.contractCost - total.cost)}
                            </td>
                            <td className="border border-blue-200 px-2 py-2 text-right text-[14px]">
                                {formatMoney(total.contractMargin - total.margin)}
                            </td>
                            <td className="border border-blue-200 px-2 py-2 text-center text-[14px]"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div >
    );
}
