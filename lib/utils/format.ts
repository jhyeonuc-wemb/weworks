// 포맷팅 유틸리티 함수

/**
 * 숫자를 천단위 구분 기호로 포맷
 */
export function formatNumber(
  value: number | null | undefined,
  options?: {
    decimalPlaces?: number;
    showZero?: boolean;
  }
): string {
  const { decimalPlaces = 0, showZero = true } = options || {};

  if (value === null || value === undefined) {
    if (!showZero) return "-";
    return (0).toFixed(decimalPlaces);
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    if (!showZero) return "-";
    return (0).toFixed(decimalPlaces);
  }

  if (numValue === 0 && !showZero) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numValue + 0);
}

/**
 * 천단위 구분 기호가 있는 문자열을 숫자로 파싱
 */
export function parseNumberFromString(str: string): number | null {
  if (!str || str.trim() === "") return null;
  const cleaned = str.replace(/,/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * 입력 필드용 숫자 포맷 (콤마 포함)
 */
export function formatNumberWithCommas(
  value: number | null | undefined
): string {
  if (value === null || value === undefined) return "";

  const numValue = Number(value);
  if (isNaN(numValue)) return "";
  if (numValue === 0) return "0";

  return numValue.toLocaleString("ko-KR");
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(
  value: number | null | undefined,
  decimalPlaces: number = 2
): string {
  if (value === null || value === undefined) return "-";

  const numValue = Number(value);
  if (isNaN(numValue)) return "-";

  return `${(numValue + 0).toFixed(decimalPlaces)}%`;
}

/**
 * 날짜 포맷
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: "short" | "long" = "short"
): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  if (format === "short") {
    return d.toLocaleDateString("ko-KR");
  }

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 통화 포맷
 */
export function formatCurrencyAmount(
  amount: number | null | undefined,
  currency: "KRW" | "USD" | "EUR" | "JPY" = "KRW",
  options?: {
    showSymbol?: boolean;
    decimalPlaces?: number;
  }
): string {
  const { showSymbol = true, decimalPlaces = 0 } = options || {};

  if (amount === null || amount === undefined) return "-";

  const numValue = Number(amount);
  if (isNaN(numValue)) return "-";

  const formatted = formatNumber(numValue, { decimalPlaces });

  if (!showSymbol) return formatted;

  const symbols: Record<string, string> = {
    KRW: "원",
    USD: "$",
    EUR: "€",
    JPY: "¥",
  };

  const symbol = symbols[currency] || "";
  return currency === "KRW" ? `${formatted}${symbol}` : `${symbol}${formatted}`;
}

/**
 * 파일 크기 포맷
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 상대 시간 포맷 (예: "2시간 전")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDate(d, "short");
}
