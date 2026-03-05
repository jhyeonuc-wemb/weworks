"use client";

import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProfitabilityStatusBadgeProps {
    status: string;
}

export function ProfitabilityStatusBadge({ status }: ProfitabilityStatusBadgeProps) {
    const getStatusConfig = (s: string) => {
        switch (s) {
            case "STANDBY":
                return { label: "대기", className: "bg-slate-100 text-slate-700 font-bold" };
            case "IN_PROGRESS":
                return { label: "작성중", className: "bg-blue-100 text-blue-700 font-bold" };
            case "COMPLETED":
                return { label: "작성완료", className: "bg-emerald-100 text-emerald-700 font-bold" };
            case "APPROVED":
                return { label: "승인완료", className: "bg-indigo-100 text-indigo-700 font-bold" };
            case "REJECTED":
                return { label: "반려", className: "bg-rose-100 text-rose-700 font-bold" };
            default:
                return { label: s, className: "bg-gray-100 text-gray-700 font-bold" };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge className={cn("px-4 h-8 rounded-xl border-none shadow-sm", config.className)}>
            {config.label}
        </Badge>
    );
}
