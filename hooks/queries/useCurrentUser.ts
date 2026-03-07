import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 현재 로그인 사용자 조회
 * - 세션 기반이므로 세션 만료 시 자동 재조회 위해 revalidateOnFocus: true
 */
export function useCurrentUser() {
    const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 30_000, // 30초
    });

    return {
        currentUser: data?.user ?? null,
        isLoading,
        error,
        mutate,
    };
}
