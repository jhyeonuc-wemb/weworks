// 제품 계획 관련 커스텀 훅

import { useState, useEffect, useCallback } from "react";
import type {
  ProductPlanItem,
  ProductMasterItem,
  ProductType,
  ProductPlanSubtotal,
} from "@/types/profitability";
import { ProductService } from "@/services/product.service";
import { ProfitabilityService } from "@/services/profitability.service";

export function useProductPlan(projectId?: number, profitabilityId?: number) {
  const [items, setItems] = useState<ProductPlanItem[]>([
    {
      id: 1,
      type: "자사",
      productId: null,
      companyName: "",
      productName: "",
      quantity: 1,
      unitPrice: null,
      basePrice: 0,
      proposalPrice: null,
      costPrice: null,
      discountRate: 0,
      requestDate: "",
      requestType: "",
      contractCostPrice: null,
    },
    {
      id: 2,
      type: "타사",
      productId: null,
      companyName: "",
      productName: "",
      quantity: 1,
      unitPrice: null,
      basePrice: 0,
      proposalPrice: null,
      costPrice: null,
      discountRate: 0,
      requestDate: "",
      requestType: "",
      contractCostPrice: null,
    },
  ]);

  const [masterItems, setMasterItems] = useState<ProductMasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 제품 마스터 목록 로드
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await ProductService.fetchList({ isActive: true });
        setMasterItems(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  // 프로젝트별 저장된 제품 계획 로딩
  const loadProductPlan = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const savedItems = await ProfitabilityService.fetchProductPlan(projectId, profitabilityId);

      if (savedItems.length > 0) {
        setItems(savedItems);
      }
    } catch (error) {
      console.error("Error loading product plan:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProductPlan();
  }, [loadProductPlan, profitabilityId]);

  // ... (rest of file)



  // 행 추가
  const addRow = useCallback((type: ProductType) => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
        type,
        productId: null,
        companyName: "",
        productName: "",
        quantity: 1,
        unitPrice: null,
        basePrice: 0,
        proposalPrice: null,
        costPrice: null,
        discountRate: 0,
        requestDate: "",
        requestType: "",
        contractCostPrice: null,
      },
    ]);
  }, []);

  // 행 삭제
  const deleteRow = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 행 업데이트
  const updateItem = useCallback(
    (id: number, field: keyof ProductPlanItem, value: string | number | null) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          let updated: ProductPlanItem = {
            ...item,
            [field]: value,
          } as ProductPlanItem;

          // 매입 원가 수정 시 구매 계약 원가 자동 연동
          if (field === "costPrice") {
            updated.contractCostPrice = value as number | null;
          }

          // 수량 / 단가 / 제안가 변경 시 기준가/할인율 재계산
          const quantity =
            field === "quantity"
              ? (value as number)
              : updated.quantity ?? item.quantity ?? 0;
          const unitPrice =
            field === "unitPrice" ? (value as number | null) : updated.unitPrice;
          const proposalPrice =
            field === "proposalPrice"
              ? (value as number | null)
              : updated.proposalPrice;

          const basePrice = quantity && unitPrice
            ? Math.round(quantity * unitPrice)
            : 0;

          let discountRate = 0;
          if (basePrice > 0 && proposalPrice != null) {
            discountRate = ((basePrice - proposalPrice) / basePrice) * 100;
          }

          updated.basePrice = basePrice;
          updated.discountRate = discountRate;

          return updated;
        })
      );
    },
    []
  );

  // 제품 선택 시 정보 자동 입력
  const selectProduct = useCallback(
    (itemId: number, productName: string) => {
      const matched = masterItems.find((p) => p.productName === productName);

      if (matched) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;

            return {
              ...item,
              productId: matched.id,
              companyName: matched.companyName,
              productName: matched.productName,
              unitPrice: matched.unitPrice,
            };
          })
        );
      } else {
        // 마스터에 없는 제품명 입력 시
        updateItem(itemId, "productId", 0);
        updateItem(itemId, "productName", productName);
      }
    },
    [masterItems, updateItem]
  );

  // 소계 계산 (margin, cost 추가)
  type ProductPlanSubtotalExtended = ProductPlanSubtotal & {
    quantity: number;
    unitPrice: number;
    cost: number;
    margin: number;
    marginRate: number;
  };

  const getSubtotal = useCallback(
    (type: ProductType): ProductPlanSubtotalExtended & { contractCost: number; contractMargin: number } => {
      const rows = items.filter((p) => p.type === type);
      const quantity = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);
      const unitPrice = rows.reduce((sum, r) => sum + (r.unitPrice || 0), 0);
      const base = rows.reduce((sum, r) => sum + r.basePrice, 0);
      const proposal = rows.reduce((sum, r) => sum + (r.proposalPrice || 0), 0);
      const cost = rows.reduce((sum, r) => sum + (r.costPrice || 0), 0);
      const contractCost = rows.reduce((sum, r) => sum + (r.contractCostPrice || 0), 0);
      const margin = proposal - cost;
      const contractMargin = proposal - contractCost;
      const discountRate = base > 0 ? ((base - proposal) / base) * 100 : 0;
      const marginRate = proposal > 0 ? (margin / proposal) * 100 : 0;

      return { quantity, unitPrice, base, proposal, cost, margin, discountRate, marginRate, contractCost, contractMargin };
    },
    [items]
  );

  // 전체 합계 계산
  const getTotal = useCallback(() => {
    const subJa = getSubtotal("자사");
    const subTa = getSubtotal("타사");

    const totalBase = subJa.base + subTa.base;
    const totalProposal = subJa.proposal + subTa.proposal;
    const totalCost = subJa.cost + subTa.cost;
    const totalContractCost = subJa.contractCost + subTa.contractCost;

    const totalMargin = totalProposal - totalCost;
    const totalContractMargin = totalProposal - totalContractCost;

    const totalDiscountRate = totalBase > 0 ? ((totalBase - totalProposal) / totalBase) * 100 : 0;
    const totalMarginRate = totalProposal > 0 ? (totalMargin / totalProposal) * 100 : 0;

    return {
      quantity: subJa.quantity + subTa.quantity,
      unitPrice: subJa.unitPrice + subTa.unitPrice,
      base: totalBase,
      proposal: totalProposal,
      cost: totalCost,
      contractCost: totalContractCost,
      margin: totalMargin,
      contractMargin: totalContractMargin,
      discountRate: totalDiscountRate,
      marginRate: totalMarginRate,
    };
  }, [getSubtotal]);

  // 저장
  const saveProductPlan = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      await ProfitabilityService.saveProductPlan(projectId, items, profitabilityId);
      return true;
    } catch (error) {
      console.error("Error saving product plan:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [projectId, items]);

  return {
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
    refresh: loadProductPlan,
  };
}
