"use client";

import { useState, useEffect, useCallback } from "react";

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
    status: string;         // 현재 상태 코드 (project_phase_statuses 기반, 동적)
    initialStatus: string;  // 이 단계의 첫 번째 상태 코드
    finalStatus: string;    // 이 단계의 마지막 상태 코드 (= 완료)
    startedAt: string | null;
    completedAt: string | null;
}

export interface ProjectPhaseState {
    phases: PhaseInfo[];
    currentPhaseCode: string | null;
    currentPhase: PhaseInfo | null;
    /** 이 화면의 단계 현재 상태 코드 */
    status: string;
    /** 이 단계의 첫 번째 상태 (= 대기/미시작) */
    initialStatus: string;
    /** 이 단계의 마지막 상태 (= 완료) */
    finalStatus: string;
    /** status === initialStatus (= 아직 시작 안 함) */
    isInitialStatus: boolean;
    /** status === finalStatus (= 완료) */
    isFinalStatus: boolean;
    loading: boolean;
    error: string | null;
}

/**
 * useProjectPhase
 * 
 * 프로젝트 단계/상태를 관리하는 중앙집중 훅.
 * 상태 코드는 project_phase_statuses 테이블에서 동적으로 읽습니다.
 * STANDBY/IN_PROGRESS/COMPLETED를 하드코딩하지 않습니다.
 * 
 * 대신 isInitialStatus / isFinalStatus 를 UI 조건 판단에 사용하세요:
 * - isInitialStatus: 아직 시작 안 한 상태 (구 STANDBY)
 * - !isInitialStatus && !isFinalStatus: 진행 중 상태 (구 IN_PROGRESS)
 * - isFinalStatus: 완료된 상태 (구 COMPLETED)
 * 
 * @example
 * const { status, isInitialStatus, isFinalStatus, onSaveSuccess, onCompleteSuccess } = useProjectPhase(projectId, 'vrb');
 * const canComplete = !isFinalStatus;
 * const isReadOnly = isFinalStatus;
 */
export function useProjectPhase(projectId: string | number | undefined, phaseCode: string) {
    const [state, setState] = useState<ProjectPhaseState>({
        phases: [],
        currentPhaseCode: null,
        currentPhase: null,
        status: "",
        initialStatus: "",
        finalStatus: "",
        isInitialStatus: true,
        isFinalStatus: false,
        loading: false,
        error: null,
    });

    /** 단계 상태 로드 (GET /api/projects/[id]/phase-status) */
    const loadPhaseStatus = useCallback(async () => {
        if (!projectId) return;
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const res = await fetch(`/api/projects/${projectId}/phase-status`);
            if (!res.ok) throw new Error("phase-status 조회 실패");
            const data = await res.json();

            const thisPhase = data.phases?.find((p: PhaseInfo) => p.code === phaseCode);
            const currentStatus = thisPhase?.status ?? thisPhase?.initialStatus ?? "";
            const initialStatus = thisPhase?.initialStatus ?? "";
            const finalStatus = thisPhase?.finalStatus ?? "";

            setState({
                phases: data.phases || [],
                currentPhaseCode: data.currentPhaseCode,
                currentPhase: data.phases?.find((p: PhaseInfo) => p.code === data.currentPhaseCode) || null,
                status: currentStatus,
                initialStatus,
                finalStatus,
                isInitialStatus: currentStatus === initialStatus,
                isFinalStatus: currentStatus === finalStatus,
                loading: false,
                error: null,
            });
        } catch (e: any) {
            setState(prev => ({ ...prev, loading: false, error: e.message }));
        }
    }, [projectId, phaseCode]);

    /**
     * 저장 시 호출: 초기 상태(대기)이면 다음 상태(진행 중 계열)로 전환
     * PATCH /api/projects/[id]/phase-progress
     */
    const updateToInProgress = useCallback(async () => {
        if (!projectId) return;
        try {
            await fetch(`/api/projects/${projectId}/phase-progress`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phaseCode, action: "start" }), // 첫 번째 상태 → 두 번째 상태
            });
        } catch (e) {
            console.warn("phase-progress update error:", e);
        }
    }, [projectId, phaseCode]);

    /** 작성완료 → 마지막 상태로 전환 + 다음 단계 전환 (POST /api/projects/[id]/advance-phase) */
    const completePhase = useCallback(async (): Promise<{ nextPhaseCode: string | null }> => {
        if (!projectId) return { nextPhaseCode: null };
        const res = await fetch(`/api/projects/${projectId}/advance-phase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPhaseCode: phaseCode }),
        });
        if (!res.ok) throw new Error("단계 완료 처리 실패");
        const data = await res.json();
        return { nextPhaseCode: data.nextPhaseCode || null };
    }, [projectId, phaseCode]);

    /** 저장 후 공통 처리: 초기 상태이면 진행 상태로 전환 후 상태 재로드 */
    const onSaveSuccess = useCallback(async () => {
        if (state.isInitialStatus) {
            await updateToInProgress();
        }
        await loadPhaseStatus();
    }, [state.isInitialStatus, updateToInProgress, loadPhaseStatus]);

    /** 작성완료 후 공통 처리: 마지막 상태로 전환 + 다음 단계 전환 후 재로드 */
    const onCompleteSuccess = useCallback(async () => {
        const result = await completePhase();
        await loadPhaseStatus();
        return result;
    }, [completePhase, loadPhaseStatus]);

    useEffect(() => {
        loadPhaseStatus();
    }, [loadPhaseStatus]);

    return {
        ...state,
        loadPhaseStatus,
        updateToInProgress,
        completePhase,
        onSaveSuccess,
        onCompleteSuccess,
    };
}
