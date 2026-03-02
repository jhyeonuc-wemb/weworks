// ============================================================
// 메뉴 설정 단일 소스 (Single Source of Truth)
// 사이드바 + 권한 관리가 이 파일을 공동으로 참조합니다.
// 메뉴 추가/삭제 시 이 파일만 수정하면 양쪽에 자동 반영됩니다.
// ============================================================

import {
    LayoutDashboard,
    FolderGit2,
    Boxes,
    Settings,
    Users,
    Shield,
    FileText,
    CheckCircle2,
    DollarSign,
    Building2,
    Briefcase,
    Wrench,
    Calendar,
    GitBranch,
    Target,
    TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================
// 단일 통합 인터페이스
// children 유무에 따라 1레벨/2레벨로 동적 구분
// 나중에 어느 항목에든 하위 메뉴를 추가할 수 있습니다.
// ============================================================
export interface SidebarMenuItem {
    menuKey: string;
    href: string;
    label: string;
    icon: LucideIcon;
    displayOrder: number;
    children?: SidebarMenuItem[];
}

export function hasChildren(item: SidebarMenuItem): boolean {
    return Array.isArray(item.children) && item.children.length > 0;
}

// ============================================================
// 메뉴 정의 (사이드바 구조와 동일)
// children이 없으면 1레벨 단독 메뉴, 있으면 2레벨 그룹 메뉴
// ============================================================
export const SIDEBAR_MENU: SidebarMenuItem[] = [
    {
        menuKey: "dashboard",
        href: "/dashboard",
        label: "대시보드",
        icon: LayoutDashboard,
        displayOrder: 10,
        // children을 추가하면 자동으로 그룹 메뉴로 전환됩니다.
    },
    {
        menuKey: "sales-group",
        href: "/sales",
        label: "영업/PS",
        icon: Briefcase,
        displayOrder: 20,
        children: [
            { menuKey: "sales/leads", href: "/sales/leads", label: "리드 현황", icon: Target, displayOrder: 21 },
            { menuKey: "sales/opportunities", href: "/sales/opportunities", label: "영업기회 현황", icon: TrendingUp, displayOrder: 22 },
        ],
    },
    {
        menuKey: "projects-group",
        href: "/projects",
        label: "프로젝트",
        icon: FolderGit2,
        displayOrder: 30,
        children: [
            { menuKey: "projects", href: "/projects", label: "프로젝트 현황", icon: FolderGit2, displayOrder: 31 },
            { menuKey: "vrb-review", href: "/vrb-review", label: "VRB 현황", icon: CheckCircle2, displayOrder: 32 },
            { menuKey: "contract-status", href: "/contract-status", label: "계약 현황", icon: FileText, displayOrder: 33 },
            { menuKey: "profitability", href: "/profitability", label: "수지분석서 현황", icon: DollarSign, displayOrder: 34 },
            { menuKey: "settlement", href: "/settlement", label: "수지정산서 현황", icon: FileText, displayOrder: 35 },
        ],
    },
    {
        menuKey: "maintenance-group",
        href: "/maintenance",
        label: "유지보수",
        icon: Wrench,
        displayOrder: 40,
        children: [
            { menuKey: "maintenance/free", href: "/maintenance/free", label: "무상 유지보수 현황", icon: Wrench, displayOrder: 41 },
            { menuKey: "maintenance/paid", href: "/maintenance/paid", label: "유상 유지보수 현황", icon: DollarSign, displayOrder: 42 },
        ],
    },
    {
        menuKey: "resources-group",
        href: "/resources",
        label: "자원",
        icon: Boxes,
        displayOrder: 50,
        children: [
            { menuKey: "resources/work-logs", href: "/resources/work-logs", label: "개인별 작업 일지", icon: Calendar, displayOrder: 51 },
        ],
    },
    {
        menuKey: "settings-group",
        href: "/settings",
        label: "설정",
        icon: Settings,
        displayOrder: 60,
        children: [
            { menuKey: "settings/business-phases", href: "/settings/business-phases", label: "사업 단계", icon: GitBranch, displayOrder: 60 },
            { menuKey: "settings/clients", href: "/settings/clients", label: "프로젝트 기준정보", icon: Building2, displayOrder: 61 },
            { menuKey: "settings/codes", href: "/settings/codes", label: "공통 코드", icon: Boxes, displayOrder: 62 },
            { menuKey: "settings/departments", href: "/settings/departments", label: "부서", icon: Building2, displayOrder: 63 },
            { menuKey: "settings/users", href: "/settings/users", label: "사용자", icon: Users, displayOrder: 64 },
            { menuKey: "settings/permissions", href: "/settings/permissions", label: "권한", icon: Shield, displayOrder: 65 },
            { menuKey: "settings/difficulty-checklist", href: "/settings/difficulty-checklist", label: "난이도 체크리스트", icon: CheckCircle2, displayOrder: 66 },
            { menuKey: "settings/md-estimation", href: "/settings/md-estimation", label: "M/D 산정 항목", icon: FileText, displayOrder: 67 },
            { menuKey: "settings/holidays", href: "/settings/holidays", label: "휴일", icon: Calendar, displayOrder: 68 },
        ],
    },
];

// ============================================================
// 권한 화면용 플랫 메뉴 목록
// level: 1 = children 없는 최상위 단독 메뉴 (현재 대시보드, 영업/PS)
// level: 2 = 그룹 내 서브 메뉴
// ============================================================
// 권한 화면용 플랫 메뉴 목록
// level 1 = 사이드바 최상위 항목 (대시보드, 영업/PS, 프로젝트, 유지보수, 자원, 설정)
//           → 굵은 행 + 체크박스 (children 유무와 무관하게 항상 포함)
// level 2 = 하위 메뉴 항목 (프로젝트 현황, VRB 현황 등)
//           → 들여쓰기 행 + 체크박스
// ============================================================
export interface PermissionMenu {
    menuKey: string;
    label: string;
    level: 1 | 2;
    group: string | null;  // 2레벨: 부모 label, 1레벨: null
    displayOrder: number;
}

export function getPermissionMenus(): PermissionMenu[] {
    const result: PermissionMenu[] = [];
    for (const item of SIDEBAR_MENU) {
        // 1레벨: 사이드바 최상위 항목은 항상 포함
        result.push({
            menuKey: item.menuKey,
            label: item.label,
            level: 1,
            group: null,
            displayOrder: item.displayOrder,
        });
        // 2레벨: 하위 메뉴가 있으면 들여쓰기 항목으로 추가
        if (hasChildren(item)) {
            for (const child of item.children!) {
                result.push({
                    menuKey: child.menuKey,
                    label: child.label,
                    level: 2,
                    group: item.label,
                    displayOrder: child.displayOrder,
                });
            }
        }
    }
    return result.sort((a, b) => a.displayOrder - b.displayOrder);
}
