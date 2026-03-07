/**
 * SWR 글로벌 설정
 * - fetcher: JSON 응답을 자동으로 파싱
 * - 에러 시 Error 객체 throw (SWR error 핸들링 표준)
 */

export const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error(`API 오류: ${res.status} ${res.statusText}`) as any;
        error.status = res.status;
        try {
            error.info = await res.json();
        } catch {
            error.info = null;
        }
        throw error;
    }
    return res.json();
};

/**
 * SWR 글로벌 옵션 기본값
 * - revalidateOnFocus: false → 탭 포커스 시 자동 재조회 비활성화 (불필요한 API 호출 방지)
 * - revalidateOnReconnect: true → 네트워크 재연결 시 재조회
 * - dedupingInterval: 5000 → 5초 내 동일 key 중복 호출 방지
 */
export const swrConfig = {
    fetcher,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    shouldRetryOnError: false,
} as const;
