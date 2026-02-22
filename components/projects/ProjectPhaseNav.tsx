"use client";

import { useRouter, usePathname } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import { LayoutDashboard, Calculator, CheckCircle2, DollarSign, FileText } from "lucide-react";

interface ProjectPhaseNavProps {
    projectId: string | number;
}

/**
 * 프로젝트 단계별 이동을 위한 네비게이션 드롭다운
 */
export const ProjectPhaseNav = ({ projectId }: ProjectPhaseNavProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const options = [
        { value: `/projects/${projectId}`, label: "프로젝트 상세" },
        { value: `/projects/${projectId}/md-estimation`, label: "M/D 산정" },
        { value: `/projects/${projectId}/vrb-review`, label: "VRB 심의" },
        { value: `/projects/${projectId}/profitability`, label: "수지분석" },
        { value: `/projects/${projectId}/settlement`, label: "수지정산" },
    ];

    // 현재 경로가 프로젝트 상세 정보 메인 페이지인 경우 표시하지 않음
    const projectDetailPath = `/projects/${projectId}`;
    if (pathname === projectDetailPath) return null;

    // 현재 경로에 맞는 옵션을 제외한 나머지 목록
    const filteredOptions = options.filter(opt => {
        if (opt.value === projectDetailPath) {
            return pathname !== projectDetailPath;
        }
        return !pathname.startsWith(opt.value);
    });

    return (
        <Dropdown
            value=""
            onChange={(value) => router.push(value as string)}
            options={filteredOptions}
            className="w-32 h-9 px-3 rounded-lg bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors"
            placeholder="단계 이동"
        />
    );
};
