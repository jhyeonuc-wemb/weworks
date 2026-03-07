import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 고객사/발주처 목록 조회
 * - 변경이 거의 없는 기준 데이터 → revalidateOnFocus/Reconnect 비활성화
 * - 여러 컴포넌트(VrbReviewTab 등)에서 공유 → 단 1회만 fetch
 */
export function useClients() {
    const { data, error, isLoading, mutate } = useSWR("/api/clients", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60_000, // 1분간 동일 요청 중복 방지
    });

    return {
        clients: (data?.clients ?? []) as Array<{ id: number; name: string; type: string; code?: string }>,
        isLoading,
        error,
        mutate,
    };
}
