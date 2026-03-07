import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 모니터링 데이터 조회
 */
export function useMonitoring() {
    const { data, error, isLoading, mutate } = useSWR("/api/monitoring", fetcher, {
        revalidateOnFocus: false,
    });

    return {
        monitoring: data ?? null,
        isLoading,
        error,
        mutate,
    };
}
