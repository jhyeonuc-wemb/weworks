// 유효성 검증 유틸리티

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 형식 검증 (한국)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/-/g, ""));
}

/**
 * 숫자 범위 검증
 */
export function isInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * 날짜 유효성 검증
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 날짜 범위 검증 (시작일 <= 종료일)
 */
export function isValidDateRange(
  startDate: string,
  endDate: string
): boolean {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(startDate) <= new Date(endDate);
}

/**
 * 필수 필드 검증
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === null || value === undefined || value === "") {
      missing.push(String(field));
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 프로젝트 코드 형식 검증 (예: P24-039)
 */
export function isValidProjectCode(code: string): boolean {
  const projectCodeRegex = /^P\d{2}-\d{3}$/;
  return projectCodeRegex.test(code);
}

/**
 * 금액 유효성 검증 (음수 불가)
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0;
}

/**
 * 퍼센트 유효성 검증 (0-100)
 */
export function isValidPercent(percent: number): boolean {
  return !isNaN(percent) && percent >= 0 && percent <= 100;
}

/**
 * 증감율 유효성 검증 (-100% 이상)
 */
export function isValidIncreaseRate(rate: number): boolean {
  return !isNaN(rate) && rate >= -100;
}

/**
 * 폼 데이터 일괄 검증
 */
export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  validator?: (value: any) => boolean;
  message: string;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];

    // 필수 필드 체크
    if (rule.required && (value === null || value === undefined || value === "")) {
      errors[String(rule.field)] = rule.message;
      continue;
    }

    // 커스텀 검증
    if (rule.validator && value !== null && value !== undefined && value !== "") {
      if (!rule.validator(value)) {
        errors[String(rule.field)] = rule.message;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 안전한 숫자 파싱
 */
export function safeParseNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 안전한 퍼센트 파싱
 */
export function safeParsePercent(value: string | number | null | undefined): number | null {
  const num = safeParseNumber(value);
  if (num < -100 || num > 100) return null;
  return num;
}
