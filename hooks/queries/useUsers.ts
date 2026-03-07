import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 사용자 목록 조회
 * - 기준 데이터 (사내 인원)
 * - 장시간 캐싱으로 반복 호출 방지
 */
export function useUsers() {
    const { data, error, isLoading, mutate } = useSWR("/api/users", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60_000,
    });

    return {
        users: (data?.users ?? []) as Array<{
            id: number;
            name: string;
            email: string;
            role_name: string;
            rank_name?: string;
            department_name?: string;
        }>,
        isLoading,
        error,
        mutate,
    };
}
