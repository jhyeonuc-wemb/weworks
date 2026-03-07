import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 프로젝트 목록 조회
 * - projects 페이지에서 사용
 * - 저장/삭제 후 mutate()로 즉시 갱신
 */
export function useProjects() {
    const { data, error, isLoading, mutate } = useSWR("/api/projects", fetcher, {
        revalidateOnFocus: false,
    });

    return {
        projects: (data?.projects ?? []) as any[],
        isLoading,
        error,
        mutate,
    };
}
