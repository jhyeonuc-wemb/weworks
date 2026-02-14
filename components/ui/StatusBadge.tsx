"use client";

import React from "react";
import { Badge } from "./Badge";
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
    status: string;
    label?: string;
    className?: string;
    showIcon?: boolean;
}

/**
 * 프로젝트 단계별 상태를 표시하는 전용 배지 컴포넌트
 * (기존 StatusDropdown을 대체하며, 단순 표시용으로 사용됨)
 */
export const StatusBadge = ({ status, label, className, showIcon = true }: StatusBadgeProps) => {
    // 상태값 매핑 및 스타일 결정
    const getStatusConfig = (s: string) => {
        const normalizedStatus = s?.trim().toUpperCase() || "STANDBY";

        // 프로젝트 워크플로우 상태 매핑
        const statusMap: Record<string, { variant: "default" | "info" | "success" | "error", text: string, icon: any, colorClass: string }> = {
            // 대기 (STANDBY)
            "STANDBY": { variant: "default", text: "대기", icon: <Circle className="h-3 w-3" />, colorClass: "bg-gray-100 text-gray-600 ring-gray-200" },
            "SALES": { variant: "default", text: "대기", icon: <Circle className="h-3 w-3" />, colorClass: "bg-gray-100 text-gray-600 ring-gray-200" },
            "ON_HOLD": { variant: "default", text: "대기", icon: <Circle className="h-3 w-3" />, colorClass: "bg-gray-100 text-gray-600 ring-gray-200" },

            // 작성 중 (IN_PROGRESS)
            "IN_PROGRESS": { variant: "info", text: "작성 중", icon: <Clock className="h-3 w-3" />, colorClass: "bg-blue-50 text-blue-700 ring-blue-200" },
            "DRAFT": { variant: "info", text: "작성 중", icon: <Clock className="h-3 w-3" />, colorClass: "bg-blue-50 text-blue-700 ring-blue-200" },
            "SALES_OPPORTUNITY": { variant: "info", text: "작성 중", icon: <Clock className="h-3 w-3" />, colorClass: "bg-blue-50 text-blue-700 ring-blue-200" },

            // 진행 중 (PROGRESSING)
            "PROGRESSING": { variant: "info", text: "진행 중", icon: <Clock className="h-3 w-3" />, colorClass: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
            "ONGOING": { variant: "info", text: "진행 중", icon: <Clock className="h-3 w-3" />, colorClass: "bg-indigo-50 text-indigo-700 ring-indigo-200" },

            // 완료 (COMPLETED)
            "COMPLETED": { variant: "success", text: "완료", icon: <CheckCircle2 className="h-3 w-3" />, colorClass: "bg-green-50 text-green-700 ring-green-200" },
            "APPROVED": { variant: "success", text: "승인", icon: <CheckCircle2 className="h-3 w-3" />, colorClass: "bg-emerald-50 text-emerald-700 ring-emerald-200" },

            // 반려 (REJECTED)
            "REJECTED": { variant: "error", text: "반려", icon: <XCircle className="h-3 w-3" />, colorClass: "bg-red-50 text-red-700 ring-red-200" },
        };

        if (statusMap[normalizedStatus]) {
            const config = statusMap[normalizedStatus];
            return {
                ...config,
                text: label || config.text
            };
        }

        // 기본값
        return {
            variant: "default" as const,
            icon: <AlertCircle className="h-3 w-3" />,
            text: label || normalizedStatus,
            colorClass: "bg-gray-100 text-gray-600 ring-gray-200"
        };
    };

    const config = getStatusConfig(status);

    return (
        <Badge
            className={cn(
                "h-7 px-3 gap-1.5 rounded-full font-semibold transition-all",
                config.colorClass,
                className
            )}
        >
            {showIcon && config.icon}
            <span>{config.text}</span>
        </Badge>
    );
};
