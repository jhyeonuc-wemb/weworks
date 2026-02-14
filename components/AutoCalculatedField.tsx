"use client";

import { Calculator } from "lucide-react";
import { formatCurrency, Currency } from "@/lib/utils/currency";

interface AutoCalculatedFieldProps {
  value: number;
  currency?: Currency;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function AutoCalculatedField({
  value,
  currency = "KRW",
  label,
  className = "",
  showIcon = true,
}: AutoCalculatedFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-500">
          {label}
        </label>
      )}
      <div className="mt-1 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
        {showIcon && <Calculator className="h-4 w-4 text-blue-600" />}
        <span className="text-sm font-semibold text-blue-900">
          {formatCurrency(value, currency)}
        </span>
        <span className="ml-auto text-xs text-blue-600">자동 계산</span>
      </div>
    </div>
  );
}
