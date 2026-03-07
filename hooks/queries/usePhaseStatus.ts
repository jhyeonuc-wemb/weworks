import useSWR from "swr";
import { fetcher } from "@/lib/swr";

export interface PhaseInfo {
    code: string;
    name: string;
    displayOrder: number;
    phaseGroup: string;
    groupName: string;
    groupColor: string | null;
    path: string;
    status: string;
    initialStatus: string;
    finalStatus: string;
    startedAt: string | null;
    completedAt: string | null;
}

interface PhaseStatusData {
    phases: PhaseInfo[];
    currentPhaseCode: string | null;
}

/**
 * 프로젝트 단계 진행 상태 조회
 * - useProjectPhase 훅 내부에서 사용
 * - cache: 'no-store' 대신 SWR deduplicate + mutate 패턴으로 대체
 * @param projectId 프로젝트 ID
 */
export function usePhaseStatus(projectId: string | number | null | undefined) {
    const key = projectId ? `/api/projects/${projectId}/phase-status` : null;
    const { data, error, isLoading, mutate } = useSWR<PhaseStatusData>(key, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 3_000, // 단계 전환 직후 재조회가 빠르게 반영되도록 짧게
    });

    return {
        phases: data?.phases ?? [],
        currentPhaseCode: data?.currentPhaseCode ?? null,
        isLoading,
        error,
        mutate,
    };
}
