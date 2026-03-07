"use client";

import { useCallback } from "react";
import { usePhaseStatus } from "@/hooks/queries/usePhaseStatus";

export interface PhaseStatusDef {
    code: string;
    name: string;
    color: string | null;
}

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

export interface ProjectPhaseState {
    phases: PhaseInfo[];
    currentPhaseCode: string | null;
    currentPhase: PhaseInfo | null;
    status: string;
    initialStatus: string;
    finalStatus: string;
    isInitialStatus: boolean;
    isFinalStatus: boolean;
    loading: boolean;
    error: string | null;
}

/**
 * useProjectPhase - SWR 기반으로 개선된 버전
 *
 * 변경사항:
 * - 내부 fetch/useState/useEffect → usePhaseStatus (SWR) 로 교체
 * - loadPhaseStatus → SWR mutate()로 대체 (캐시 무효화 + 재조회)
 * - completePhase/onCompleteSuccess 시그니처 유지
 */
export function useProjectPhase(projectId: string | number | undefined, phaseCode: string) {
    const { phases, currentPhaseCode, isLoading, error, mutate } = usePhaseStatus(projectId);

    // 이 화면의 단계 정보
    const thisPhase = phases.find((p: PhaseInfo) => p.code === phaseCode);
    const currentStatus = thisPhase?.status ?? thisPhase?.initialStatus ?? "";
    const initialStatus = thisPhase?.initialStatus ?? "";
    const finalStatus = thisPhase?.finalStatus ?? "";
    const isInitialStatus = !!initialStatus && currentStatus === initialStatus;
    const isFinalStatus = !!finalStatus && currentStatus === finalStatus;

    const currentPhase = phases.find((p: PhaseInfo) => p.code === currentPhaseCode) ?? null;

    /** 단계 상태 수동 재로드 (SWR mutate로 캐시 무효화) */
    const loadPhaseStatus = useCallback(async () => {
        await mutate();
    }, [mutate]);

    /** 저장 시 호출: 초기 상태이면 진행 상태로 전환 후 재로드 */
    const updateToInProgress = useCallback(async () => {
        if (!projectId) return;
        try {
            await fetch(`/api/projects/${projectId}/phase-progress`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phaseCode, action: "start" }),
            });
        } catch (e) {
            console.warn("phase-progress update error:", e);
        }
    }, [projectId, phaseCode]);

    /** 작성완료 → 마지막 상태로 전환 + 다음 단계 전환 */
    const completePhase = useCallback(async (opts?: { targetPhaseCode?: string }): Promise<{ nextPhaseCode: string | null }> => {
        if (!projectId) return { nextPhaseCode: null };
        const res = await fetch(`/api/projects/${projectId}/advance-phase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPhaseCode: phaseCode, targetPhaseCode: opts?.targetPhaseCode }),
        });
        if (!res.ok) throw new Error("단계 완료 처리 실패");
        const data = await res.json();
        return { nextPhaseCode: data.nextPhaseCode || null };
    }, [projectId, phaseCode]);

    /** 저장 후 공통 처리 */
    const onSaveSuccess = useCallback(async () => {
        if (isInitialStatus) {
            await updateToInProgress();
        }
        await mutate();
    }, [isInitialStatus, updateToInProgress, mutate]);

    /** 작성완료 후 공통 처리 */
    const onCompleteSuccess = useCallback(async (opts?: { targetPhaseCode?: string }) => {
        const result = await completePhase(opts);
        await mutate();
        return result;
    }, [completePhase, mutate]);

    return {
        phases,
        currentPhaseCode,
        currentPhase,
        status: currentStatus,
        initialStatus,
        finalStatus,
        isInitialStatus,
        isFinalStatus,
        loading: isLoading,
        error: error?.message ?? null,
        loadPhaseStatus,
        updateToInProgress,
        completePhase,
        onSaveSuccess,
        onCompleteSuccess,
    };
}
