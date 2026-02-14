"use client";
import Link from "next/link";
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
  UserCog,
  Briefcase,
  Wrench,
  Calendar,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const items = [
  {
    href: "/dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
  },
  {
    href: "/sales",
    label: "영업/PS",
    icon: Briefcase,
  },
  {
    href: "/projects",
    label: "프로젝트",
    icon: FolderGit2,
    subItems: [
      {
        href: "/projects",
        label: "프로젝트 현황",
        icon: FolderGit2,
      },
      {
        href: "/md-estimation",
        label: "M/D 산정 현황",
        icon: FileText,
      },
      {
        href: "/vrb-review",
        label: "VRB 현황",
        icon: CheckCircle2,
      },
      {
        href: "/contract-status",
        label: "계약 현황",
        icon: FileText,
      },
      {
        href: "/profitability",
        label: "수지분석서 현황",
        icon: DollarSign,
      },
      {
        href: "/settlement",
        label: "수지정산서 현황",
        icon: FileText,
      },
    ],
  },
  {
    href: "/maintenance",
    label: "유지보수",
    icon: Wrench,
    subItems: [
      {
        href: "/maintenance/free",
        label: "무상 유지보수 현황",
        icon: Wrench,
      },
      {
        href: "/maintenance/paid",
        label: "유상 유지보수 현황",
        icon: DollarSign,
      },
    ],
  },
  {
    href: "/resources",
    label: "자원",
    icon: Boxes,
    subItems: [
      {
        href: "/resources/work-logs",
        label: "개인별 작업 일지",
        icon: Calendar,
      },
    ],
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
    subItems: [
      {
        href: "/settings/clients",
        label: "프로젝트 기준정보",
        icon: Building2,
      },
      {
        href: "/settings/codes",
        label: "공통 코드",
        icon: Boxes,
      },
      {
        href: "/settings/departments",
        label: "부서",
        icon: Building2,
      },
      {
        href: "/settings/users",
        label: "사용자",
        icon: Users,
      },
      {
        href: "/settings/permissions",
        label: "권한",
        icon: Shield,
      },
    ],
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
  onExpand?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onLinkClick, onExpand, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const item = items.find(
      (i) => i.subItems && (
        pathname === i.href ||
        pathname?.startsWith(i.href + "/") ||
        i.subItems.some((sub) => pathname === sub.href || pathname?.startsWith(sub.href + "/"))
      )
    );
    return item ? [item.href] : [];
  });

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const handleClick = (e: React.MouseEvent, item: any) => {
    if (item.subItems) {
      e.preventDefault(); // 서브메뉴가 있으면 페이지 이동 방지
      toggleExpand(item.href);
    }

    if (collapsed && onExpand) {
      onExpand();
    } else if (onLinkClick && !item.subItems) {
      onLinkClick();
    }
  };

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        // 서브메뉴 중 하나가 선택되어 있는지 확인
        const hasActiveSubItem = hasSubItems && item.subItems!.some(
          (sub) => pathname === sub.href || pathname?.startsWith(sub.href + "/")
        );
        // 상위 메뉴 또는 서브메뉴가 선택되어 있으면 active
        const active = hasActiveSubItem ||
          pathname === item.href ||
          (item.href !== "/dashboard" && !hasSubItems && pathname?.startsWith(item.href));
        const isExpanded = expandedItems.includes(item.href);

        return (
          <div key={item.href} className="group/item mb-1">
            <div className="relative">
              <Link
                href={item.href}
                onClick={(e) => handleClick(e, item)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-black tracking-tight transition-all duration-300",
                  active
                    ? hasSubItems
                      ? "bg-slate-900 text-white" // 서브메뉴 있으면 그림자 제거
                      : "bg-slate-900 text-white shadow-xl shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  collapsed && "justify-center px-0 h-10 w-10 mx-auto",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                  active
                    ? "text-white"
                    : "bg-slate-100 group-hover/item:bg-white group-hover/item:shadow-sm text-slate-400 group-hover/item:text-slate-900"
                )}>
                  <Icon size={16} strokeWidth={active ? 3 : 2.5} />
                </div>

                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!collapsed && hasSubItems && (
                  <div className={cn(
                    "p-1 rounded-lg transition-all duration-300 ml-auto",
                    isExpanded && "rotate-180",
                    active
                      ? isExpanded
                        ? "bg-white/20 text-white group-hover/item:bg-white/40"
                        : "text-slate-400 group-hover/item:text-white"
                      : isExpanded
                        ? "bg-slate-100 text-slate-700 group-hover/item:bg-slate-200"
                        : "text-slate-400 group-hover/item:text-slate-700 group-hover/item:bg-slate-100"
                  )}>
                    <ChevronDown size={12} strokeWidth={3} />
                  </div>
                )}
              </Link>
            </div>

            {
              !collapsed && hasSubItems && isExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {item.subItems!.map((subItem) => {
                    const subActive = pathname === subItem.href;

                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onLinkClick}
                        className={cn(
                          "group/sub flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-bold transition-all duration-200",
                          subActive
                            ? "text-slate-900 bg-slate-50"
                            : "text-slate-400 hover:text-slate-900 hover:bg-slate-50",
                        )}
                      >
                        <div className={cn(
                          "w-1 h-1 rounded-full transition-all duration-300",
                          subActive ? "bg-slate-900 scale-150 shadow-sm" : "bg-slate-200 group-hover/sub:bg-slate-400"
                        )} />
                        <span className="flex-1 truncate">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )
            }
          </div >
        );
      })}
    </nav >
  );
}

import { ChevronDown } from "lucide-react";


