import useSWR from "swr";
import { fetcher } from "@/lib/swr";

/**
 * 프로젝트 단건 조회
 * - 저장/수정 후 mutate()로 즉시 갱신
 * @param projectId 프로젝트 ID (없으면 fetch하지 않음)
 */
export function useProject(projectId: string | number | null | undefined) {
    const key = projectId ? `/api/projects/${projectId}` : null;
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return {
        project: data?.project ?? null,
        isLoading,
        error,
        mutate,
    };
}
