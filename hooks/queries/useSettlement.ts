import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 정산 목록 조회
 * @param projectId 프로젝트 ID (선택)
 */
export function useSettlement(projectId?: string | number | null) {
    const key = projectId
        ? `/api/settlement?projectId=${projectId}`
        : "/api/settlement";
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return {
        settlement: data?.settlement ?? data?.settlements ?? null,
        isLoading,
        error,
        mutate,
    };
}
