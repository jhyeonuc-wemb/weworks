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
        <div>
          <h2 className="text-lg font-semibold text-gray-900">기준-경비</h2>
          <p className="mt-1 text-sm text-gray-600">
            프로젝트 수행에 필요한 표준 경비 기준을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">(단위:천원)</span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={(e) => handleSave(e)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse border border-gray-300 table-fixed">
          <colgroup>
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
            <col style={{ width: "14.28%" }} />
          </colgroup>
          <thead className="bg-blue-50/50">
            <tr className="h-[35px] border-b border-gray-300">
              <th
                colSpan={3}
                className="px-[10px] text-center text-sm font-bold text-gray-900 border border-gray-300 bg-blue-50/50"
              >
                구분
              </th>
              <th
                colSpan={3}
                className="px-[10px] text-center text-sm font-bold text-gray-900 border border-gray-300 bg-blue-50/50"
              >
                기준
              </th>
              <th className="px-[10px] text-center text-sm font-bold text-gray-900 border border-gray-300 bg-blue-50/50">
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
              const isCalculatedEditable = [1, 6, 7, 8].includes(expense.id); // 계산값 수정 가능
              const isFinalAmountEditable = [4, 5].includes(expense.id); // 최종액 직접 수정 가능
              const shouldMergeStandard = [2, 3, 4, 5, 9].includes(expense.id); // 기준 병합 여부

              return (
                <tr key={expense.id} className="h-[35px]">
                  {/* 구분 영역 */}
                  {isFromLocalRental ? (
                    <td
                      colSpan={3}
                      className="border border-gray-300 px-[10px] text-sm text-gray-900 h-[35px]"
                    >
                      {expense.item}
                    </td>
                  ) : isFromWorkshop ? (
                    <>
                      <td
                        colSpan={2}
                        className="border border-gray-300 px-[10px] text-sm text-gray-900 h-[35px]"
                      >
                        {expense.item}
                      </td>
                      <td className="border border-gray-300 px-[10px] text-sm text-gray-600 text-center h-[35px]">
                        {expense.standardType || ""}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-300 px-[10px] text-sm text-gray-900 h-[35px]"
                      >
                        {expense.item}
                      </td>
                      <td className="border border-gray-300 px-[10px] text-sm text-gray-900 text-center h-[35px]">
                        {expense.category || ""}
                      </td>
                      <td className="border border-gray-300 px-[10px] text-sm text-gray-600 text-center h-[35px]">
                        {expense.standardType || ""}
                      </td>
                    </>
                  )}

                  {/* 기준 영역 */}
                  {shouldMergeStandard ? (
                    <td
                      colSpan={3}
                      className="border border-gray-300 px-[10px] text-left text-sm text-gray-900 h-[35px]"
                    >
                      {expense.standardDetail}
                    </td>
                  ) : (
                    <>
                      <td className="border border-gray-300 px-[10px] text-left text-sm text-gray-900 h-[35px]">
                        {expense.standardDetail}
                      </td>
                      <td className="border border-gray-300 px-[10px] text-right text-sm text-gray-900 h-[35px]">
                        {expense.inputValue !== null
                          ? expense.inputValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                          : ""}
                      </td>
                      <td className={`border border-gray-300 ${isCalculatedEditable ? 'p-0' : 'px-[10px]'} text-right h-[35px]`}>
                        {isCalculatedEditable ? (
                          <input
                            type="text"
                            value={expense.calculatedValue === null ? "" : expense.calculatedValue.toLocaleString()}
                            onChange={(e) => {
                              if (isReadOnly) return;
                              const val = parseInt(e.target.value.replace(/,/g, ""));
                              if (!isNaN(val)) {
                                updateExpense(expense.id, "calculatedValue", val);
                              } else if (e.target.value === "") {
                                updateExpense(expense.id, "calculatedValue", 0);
                              }
                            }}
                            disabled={isReadOnly}
                            className={`w-full h-[35px] border-none rounded-none px-[10px] text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors placeholder:text-gray-400 ${isReadOnly ? "cursor-not-allowed bg-gray-50" : ""}`}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {expense.inputValue !== null && expense.calculatedValue !== null
                              ? expense.calculatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                              : ""}
                          </span>
                        )}
                      </td>
                    </>
                  )}

                  {/* 기준액 */}
                  <td className={`border border-gray-300 ${isFinalAmountEditable ? 'p-0' : 'px-[10px]'} text-right text-sm font-bold text-gray-900 h-[35px]`}>
                    {isFinalAmountEditable ? (
                      <input
                        type="text"
                        value={expense.finalAmount === null ? "" : expense.finalAmount.toLocaleString()}
                        onChange={(e) => {
                          if (isReadOnly) return;
                          const val = parseInt(e.target.value.replace(/,/g, ""));
                          if (!isNaN(val)) {
                            updateExpense(expense.id, "finalAmount", val);
                          } else if (e.target.value === "") {
                            updateExpense(expense.id, "finalAmount", 0);
                          }
                        }}
                        disabled={isReadOnly}
                        className={`w-full h-[35px] border-none rounded-none px-[10px] text-right text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white bg-transparent hover:bg-blue-50 transition-colors placeholder:text-gray-400 ${isReadOnly ? "cursor-not-allowed bg-gray-50" : ""}`}
                      />
                    ) : expense.id === 9 ? (
                      ""
                    ) : (
                      <span>{finalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}</span>
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
