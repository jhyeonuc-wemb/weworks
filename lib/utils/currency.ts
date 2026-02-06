// 통화 타입 정의
export type Currency = "KRW" | "USD" | "EUR" | "JPY";

// 통화 정보
export const CURRENCIES: Record<
  Currency,
  { symbol: string; name: string; decimalPlaces: number }
> = {
  KRW: { symbol: "원", name: "원화", decimalPlaces: 0 },
  USD: { symbol: "$", name: "미국 달러", decimalPlaces: 2 },
  EUR: { symbol: "€", name: "유로", decimalPlaces: 2 },
  JPY: { symbol: "¥", name: "일본 엔", decimalPlaces: 0 },
};

// 숫자를 통화 형식으로 포맷팅
export function formatCurrency(
  amount: number,
  currency: Currency = "KRW",
  showSymbol: boolean = true
): string {
  const currencyInfo = CURRENCIES[currency];
  const formatted = new Intl.NumberFormat(
    currency === "KRW" ? "ko-KR" : "en-US",
    {
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces,
    }
  ).format(amount);

  if (showSymbol) {
    if (currency === "KRW") {
      return `${formatted}${currencyInfo.symbol}`;
    } else {
      return `${currencyInfo.symbol}${formatted}`;
    }
  }
  return formatted;
}

// 숫자를 천자리 구분 형식으로 포맷팅 (통화 없이)
export function formatNumber(
  value: number,
  decimalPlaces: number = 0
): string {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

// 통화 문자열을 숫자로 변환
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
}
