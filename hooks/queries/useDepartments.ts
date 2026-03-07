import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 부서 목록 조회
 * - 기준 데이터 (부서 구조는 자주 변경되지 않음)
 */
export function useDepartments() {
    const { data, error, isLoading, mutate } = useSWR("/api/departments", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60_000,
    });

    return {
        departments: (data?.departments ?? []) as Array<{
            id: number;
            name: string;
            code: string;
            parentId: number | null;
            order: number;
        }>,
        isLoading,
        error,
        mutate,
    };
}
