// 기준경비 관련 커스텀 훅

import { useState, useEffect, useCallback } from "react";
import type { StandardExpense } from "@/types/profitability";
import { DEFAULT_STANDARD_EXPENSES } from "@/constants/master-data";
import { ProfitabilityService } from "@/services/profitability.service";

export function useStandardExpenses(projectId: number) {
  const [expenses, setExpenses] = useState<StandardExpense[]>(
    DEFAULT_STANDARD_EXPENSES.map((e) => ({ ...e }))
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!projectId);

  // 프로젝트별 저장된 값 로드
  const loadExpenses = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const savedItems = await ProfitabilityService.fetchStandardExpenses(
        projectId
      );

      setExpenses((prev) =>
        prev.map((exp) => {
          const override = savedItems.find((i: any) => i.rowId === exp.id);
          if (!override) return exp;

          return {
            ...exp,
            calculatedValue:
              override.calculatedValue !== null &&
                override.calculatedValue !== undefined
                ? override.calculatedValue
                : exp.calculatedValue,
            finalAmount:
              override.finalAmount !== null &&
                override.finalAmount !== undefined
                ? override.finalAmount
                : exp.finalAmount,
          };
        })
      );
    } catch (error) {
      console.error("Error loading standard expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // 값 업데이트
  const updateExpense = useCallback(
    (id: number, field: keyof StandardExpense, value: number) => {
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id ? { ...exp, [field]: value } : exp
        )
      );
    },
    []
  );

  // 저장
  const saveExpenses = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);

      // 수정 가능한 필드만 추출
      const editableCalculatedRows = new Set([1, 6, 7, 8]);
      const editableFinalAmountRows = new Set([4, 5]);

      const items = expenses
        .filter(
          (exp) =>
            editableCalculatedRows.has(exp.id) ||
            editableFinalAmountRows.has(exp.id)
        )
        .map((exp) => ({
          rowId: exp.id,
          calculatedValue: editableCalculatedRows.has(exp.id)
            ? exp.calculatedValue
            : null,
          finalAmount: editableFinalAmountRows.has(exp.id)
            ? exp.finalAmount
            : null,
        }));

      await ProfitabilityService.saveStandardExpenses(projectId, items);
      return true;
    } catch (error) {
      console.error("Error saving standard expenses:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [projectId, expenses]);

  return {
    expenses,
    loading,
    saving,
    updateExpense,
    saveExpenses,
    refresh: loadExpenses,
  };
}
