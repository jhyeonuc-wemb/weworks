"use client";

import { Currency, CURRENCIES } from "@/lib/utils/currency";

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  className = "",
}: CurrencySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className={`rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 ${className}`}
    >
      {Object.entries(CURRENCIES).map(([code, info]) => (
        <option key={code} value={code}>
          {info.name} ({info.symbol})
        </option>
      ))}
    </select>
  );
}
