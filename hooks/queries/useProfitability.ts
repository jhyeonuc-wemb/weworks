import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 영업기회(리드/오더) 목록 조회
 * @param projectId 프로젝트 ID (선택)
 */
export function useProfitability(projectId?: string | number | null) {
    const key = projectId
        ? `/api/profitability?projectId=${projectId}`
        : "/api/profitability";
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return {
        profitability: data?.data ?? data ?? null,
        isLoading,
        error,
        mutate,
    };
}
