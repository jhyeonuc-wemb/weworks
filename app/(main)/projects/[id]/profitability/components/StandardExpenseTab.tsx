"use client";

import { Save } from "lucide-react";
import { useStandardExpenses } from "@/hooks/useStandardExpenses";

interface StandardExpenseTabProps {
  projectId: number;
  onSave?: () => void;
  isReadOnly?: boolean;
}

export function StandardExpenseTab({ projectId, onSave, isReadOnly = false }: StandardExpenseTabProps) {
  const { expenses, loading, saving, updateExpense, saveExpenses } =
    useStandardExpenses(projectId);

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await saveExpenses();
      alert("기준-경비가 저장되었습니다.");
      if (onSave) onSave();
    } catch (error) {
      alert("기준-경비 저장에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">기준-경비를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">기준-경비</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">(단위:천원)</span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={(e) => handleSave(e)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                colSpan={3}
                className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500 border-r border-gray-300"
              >
                구분
              </th>
              <th
                colSpan={3}
                className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500 border-r border-gray-300"
              >
                기준
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider text-blue-700 bg-blue-50">
                기준액
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expenses.map((expense) => {
              // 기준액 계산
              const finalAmount =
                expense.inputValue !== null && expense.calculatedValue !== null
                  ? expense.inputValue * expense.calculatedValue
                  : expense.finalAmount;

              const isFromWorkshop = [4, 5].includes(expense.id);
              const isFromLocalRental = [6, 7, 8, 9].includes(expense.id);

              // 수정 가능 여부
              const isCalculatedEditable = [1, 6, 7, 8].includes(expense.id);
              const isFinalAmountEditable = [4, 5].includes(expense.id);
              const shouldMergeStandard = [2, 3, 4, 5, 9].includes(expense.id);

              return (
                <tr key={expense.id} className="hover:bg-gray-50">
                  {/* 구분 영역 */}
                  {isFromLocalRental ? (
                    <td
                      colSpan={3}
                      className="w-[300px] px-4 py-3 text-sm text-gray-900 border-r border-gray-300"
                    >
                      {expense.item}
                    </td>
                  ) : isFromWorkshop ? (
                    <>
                      <td
                        colSpan={2}
                        className="w-[300px] px-4 py-3 text-sm text-gray-900 border-r border-gray-300"
                      >
                        {expense.item}
                      </td>
                      <td className="w-24 px-4 py-3 text-sm text-gray-600 border-r border-gray-300 text-center">
                        {expense.standardType || ""}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="w-[300px] px-4 py-3 text-sm text-gray-900 border-r border-gray-300"
                      >
                        {expense.item}
                      </td>
                      <td className="w-24 px-4 py-3 text-sm text-gray-900 border-r border-gray-300 text-center text-sm">
                        {expense.category || ""}
                      </td>
                      <td className="w-24 px-4 py-3 text-sm text-gray-600 border-r border-gray-300 text-center">
                        {expense.standardType || ""}
                      </td>
                    </>
                  )}

                  {/* 기준 영역 */}
                  {shouldMergeStandard ? (
                    <td
                      colSpan={3}
                      className="w-[200px] px-4 py-3 text-sm text-gray-900 text-left border-r border-gray-300"
                    >
                      {expense.standardDetail}
                    </td>
                  ) : (
                    <>
                      <td className="w-[200px] px-4 py-3 text-sm text-gray-900 text-left border-r border-gray-300">
                        {expense.standardDetail}
                      </td>
                      <td className="w-32 px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-300">
                        {expense.inputValue !== null
                          ? expense.inputValue.toLocaleString()
                          : ""}
                      </td>
                      <td className="w-32 px-4 py-3 text-right border-r border-gray-300">
                        {isCalculatedEditable ? (
                          <input
                            type="number"
                            value={expense.calculatedValue === null ? "" : expense.calculatedValue}
                            onChange={(e) => {
                              if (isReadOnly) return;
                              const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                updateExpense(expense.id, "calculatedValue", val);
                              }
                            }}
                            onBlur={(e) => {
                              if (isReadOnly) return;
                              if (e.target.value === "") {
                                updateExpense(expense.id, "calculatedValue", 0);
                              }
                            }}
                            disabled={isReadOnly}
                            className={`w-full rounded border border-gray-200 px-2 py-1 pr-0 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {expense.inputValue !== null && expense.calculatedValue !== null
                              ? expense.calculatedValue.toLocaleString()
                              : ""}
                          </span>
                        )}
                      </td>
                    </>
                  )}

                  {/* 기준액 */}
                  <td className="w-40 px-4 py-3 text-right text-sm font-bold text-gray-900 bg-blue-50">
                    {isFinalAmountEditable ? (
                      <input
                        type="number"
                        value={expense.finalAmount === null ? "" : expense.finalAmount}
                        onChange={(e) => {
                          if (isReadOnly) return;
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            updateExpense(expense.id, "finalAmount", val);
                          }
                        }}
                        onBlur={(e) => {
                          if (isReadOnly) return;
                          if (e.target.value === "") {
                            updateExpense(expense.id, "finalAmount", 0);
                          }
                        }}
                        disabled={isReadOnly}
                        className={`w-full rounded border border-gray-200 px-2 py-1 pr-0 text-right text-sm font-bold bg-blue-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                    ) : expense.id === 9 ? (
                      ""
                    ) : (
                      <span>{finalAmount?.toLocaleString() || "0"}</span>
                    )}
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
