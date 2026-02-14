"use client";

import { Currency, CURRENCIES } from "@/lib/utils/currency";

import { Dropdown } from "@/components/ui";

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
    <Dropdown
      value={value}
      onChange={(val) => onChange(val as Currency)}
      options={Object.entries(CURRENCIES).map(([code, info]) => ({
        value: code,
        label: `${info.name} (${info.symbol})`,
      }))}
      variant="standard"
      className={className}
    />
  );
}
