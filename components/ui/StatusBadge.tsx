"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "./Badge";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
    status: string;
    label?: string; // 직접 라벨을 전달할 경우 사용 (전역 캐시 우선)
    className?: string;
    showIcon?: boolean;
}

// ── 모듈 수준 캐시 (앱 전체에서 한 번만 fetch) ──────────────────────────
// { "STANDBY": "대기", "IN_PROGRESS": "진행 중", ... } 형태로 저장
let statusNameCache: Record<string, string> | null = null;
let fetchPromise: Promise<void> | null = null;

function loadStatusNames(): Promise<void> {
    if (statusNameCache !== null) return Promise.resolve();
    if (fetchPromise) return fetchPromise;

    fetchPromise = fetch("/api/settings/phase-statuses", { cache: "no-store" })
        .then(res => res.ok ? res.json() : { statuses: [] })
        .then(data => {
            const map: Record<string, string> = {};
            for (const s of data.statuses || []) {
                // code는 "STANDBY" 등 대문자 코드
                if (s.code && s.name) map[s.code.toUpperCase()] = s.name;
            }
            statusNameCache = map;
        })
        .catch(() => {
            statusNameCache = {}; // 실패 시 빈 캐시로 처리
        });

    return fetchPromise;
}

// ── 상태 코드 → 표시 스타일 매핑 ─────────────────────────────────────────
function getStatusStyle(code: string): {
    icon: React.ReactNode;
    colorClass: string;
} {
    const upper = code?.trim().toUpperCase() || "STANDBY";

    // 의미별 그룹핑 (코드명 패턴 기반)
    if (upper === "STANDBY" || upper === "SALES" || upper === "ON_HOLD") {
        return {
            icon: <Circle className="h-3 w-3" />,
            colorClass: "bg-gray-100 text-gray-600 ring-gray-200",
        };
    }
    if (upper.includes("PROGRESS") || upper.includes("DRAFT") || upper === "SALES_OPPORTUNITY") {
        return {
            icon: <Clock className="h-3 w-3" />,
            colorClass: "bg-blue-50 text-blue-700 ring-blue-200",
        };
    }
    if (upper === "COMPLETED" || upper.includes("COMPLET")) {
        return {
            icon: <CheckCircle2 className="h-3 w-3" />,
            colorClass: "bg-green-50 text-green-700 ring-green-200",
        };
    }
    if (upper === "APPROVED" || upper.includes("APPROV")) {
        return {
            icon: <CheckCircle2 className="h-3 w-3" />,
            colorClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        };
    }
    if (upper === "REJECTED" || upper.includes("REJECT")) {
        return {
            icon: <AlertCircle className="h-3 w-3" />,
            colorClass: "bg-red-50 text-red-700 ring-red-200",
        };
    }
    // 그 외 진행형
    if (upper.includes("ING") || upper.includes("ONGOING") || upper.includes("PROCESS")) {
        return {
            icon: <Clock className="h-3 w-3" />,
            colorClass: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        };
    }

    // 기본
    return {
        icon: <Circle className="h-3 w-3" />,
        colorClass: "bg-gray-100 text-gray-600 ring-gray-200",
    };
}

/**
 * 프로젝트 단계별 상태를 표시하는 전용 배지 컴포넌트
 *
 * - label prop이 있으면 그것을 사용
 * - 없으면 project_phase_statuses API에서 전역 캐시로 status 코드 → 이름 변환
 * - 두 가지 모두 없으면 status 코드 원문 표시
 */
export const StatusBadge = ({ status, label, className, showIcon = true }: StatusBadgeProps) => {
    const [resolvedLabel, setResolvedLabel] = useState<string>(
        label || status || "STANDBY"
    );

    useEffect(() => {
        // label prop이 직접 전달된 경우 우선 사용
        if (label) {
            setResolvedLabel(label);
            return;
        }

        const upper = (status || "STANDBY").trim().toUpperCase();

        // 캐시가 이미 있으면 즉시 반영
        if (statusNameCache !== null) {
            setResolvedLabel(statusNameCache[upper] || status);
            return;
        }

        // 아직 캐시가 없으면 로드 후 반영
        loadStatusNames().then(() => {
            setResolvedLabel(statusNameCache?.[upper] || status);
        });
    }, [status, label]);

    const { icon, colorClass } = getStatusStyle(status);

    return (
        <Badge
            className={cn(
                "h-7 px-3 gap-1.5 rounded-full font-semibold transition-all",
                colorClass,
                className
            )}
        >
            {showIcon && icon}
            <span>{resolvedLabel}</span>
        </Badge>
    );
};
