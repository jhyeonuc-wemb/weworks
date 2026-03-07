import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 공통코드 목록 조회
 * @param parentCode 부모 코드 (예: CD_001_01)
 * @param includeInactive 비활성 포함 여부
 */
export function useCodes(parentCode?: string, includeInactive?: boolean) {
    const params = new URLSearchParams();
    if (parentCode) params.set("parentCode", parentCode);
    if (includeInactive) params.set("includeInactive", "true");

    const queryString = params.toString();
    const key = queryString ? `/api/codes?${queryString}` : "/api/codes";

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60_000, // 공통코드는 거의 변경 안 됨
    });

    return {
        codes: (data?.codes ?? []) as Array<{
            id: number;
            code: string;
            name: string;
            parentCode: string | null;
            isActive: boolean;
            order: number;
        }>,
        isLoading,
        error,
        mutate,
    };
}
