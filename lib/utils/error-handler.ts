// 에러 핸들링 유틸리티

/**
 * API 에러 타입
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 검증 에러 타입
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * 에러 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * HTTP 응답 에러 처리
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.message || data.error || "API 요청에 실패했습니다.",
      response.status,
      data.code
    );
  }

  return response.json();
}

/**
 * try-catch 래퍼
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(errorMessage || "작업 중 오류가 발생했습니다.");
    return { data: null, error: err };
  }
}

/**
 * 에러 로깅 (프로덕션용)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", error, context);
    return;
  }

  // 프로덕션: 외부 로깅 서비스로 전송
  // 예: Sentry, LogRocket 등
  try {
    // window.Sentry?.captureException(error, { extra: context });
    console.error("Production Error:", error, context);
  } catch (loggingError) {
    console.error("Failed to log error:", loggingError);
  }
}

/**
 * 사용자 친화적 에러 메시지
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return "입력하신 정보를 확인해 주세요.";
      case 401:
        return "로그인이 필요합니다.";
      case 403:
        return "접근 권한이 없습니다.";
      case 404:
        return "요청하신 정보를 찾을 수 없습니다.";
      case 409:
        return "중복된 데이터가 존재합니다.";
      case 500:
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      default:
        return error.message;
    }
  }

  return getErrorMessage(error);
}

/**
 * 에러 토스트 표시 헬퍼
 */
export function showErrorToast(error: unknown) {
  const message = getUserFriendlyErrorMessage(error);
  alert(message); // TODO: toast 라이브러리로 대체
  logError(error);
}

/**
 * 성공 토스트 표시 헬퍼
 */
export function showSuccessToast(message: string) {
  alert(message); // TODO: toast 라이브러리로 대체
}

/**
 * 확인 대화상자
 */
export function confirm(message: string): boolean {
  return window.confirm(message);
}

/**
 * 에러 경계(Error Boundary) 대체 훅
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: unknown) => {
    const err =
      error instanceof Error
        ? error
        : new Error(getErrorMessage(error));
    setError(err);
    logError(err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

// useState import 추가
import { useState, useCallback } from "react";
