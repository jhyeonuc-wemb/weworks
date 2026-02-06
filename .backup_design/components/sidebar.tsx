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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderGit2,
    subItems: [
      {
        href: "/md-estimation",
        label: "M/D 산정",
        icon: FileText,
      },
      {
        href: "/vrb-review",
        label: "VRB",
        icon: CheckCircle2,
      },
      {
        href: "/profitability",
        label: "수지분석서",
        icon: DollarSign,
      },
      {
        href: "/settlement",
        label: "수지정산서",
        icon: FileText,
      },
    ],
  },
  {
    href: "/resources",
    label: "Resources",
    icon: Boxes,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    subItems: [
      {
        href: "/settings/clients",
        label: "프로젝트 기준정보",
        icon: Building2,
      },
      {
        href: "/settings/users",
        label: "Users",
        icon: Users,
      },
      {
        href: "/settings/departments",
        label: "부서 관리",
        icon: Building2,
      },
      {
        href: "/settings/permissions",
        label: "Roles & Permissions",
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
      (i) => i.subItems && (pathname === i.href || pathname?.startsWith(i.href + "/"))
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
      e.preventDefault();
      toggleExpand(item.href);
    }

    if (collapsed && onExpand) {
      onExpand();
    } else if (onLinkClick && !item.subItems) {
      onLinkClick();
    }
  };

  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const isExpanded = expandedItems.includes(item.href);
        const hasSubItems = item.subItems && item.subItems.length > 0;

        return (
          <div key={item.href} className="group/item">
            <div className="relative">
              {active && (
                <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full shadow-[2px_0_8px_rgba(37,99,235,0.4)] z-10" />
              )}

              <Link
                href={item.href}
                onClick={(e) => handleClick(e, item)}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-300 overflow-hidden",
                  active
                    ? "bg-blue-50/50 text-blue-700 shadow-sm border border-blue-100/50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center px-0 h-12 w-12 mx-auto",
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "bg-gray-100/50 text-gray-500 group-hover/item:bg-white group-hover/item:shadow-md group-hover/item:text-blue-600 border border-transparent group-hover/item:border-gray-100"
                )}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>

                {!collapsed && (
                  <span className="flex-1 tracking-tight truncate">{item.label}</span>
                )}

                {!collapsed && hasSubItems && (
                  <div className={cn(
                    "p-1 rounded-lg transition-transform duration-300",
                    isExpanded ? "rotate-180 bg-blue-100/50 text-blue-600" : "text-gray-300"
                  )}>
                    <ChevronDown size={14} strokeWidth={3} />
                  </div>
                )}

                {/* Magnetic Hover Effect Background */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover/item:bg-blue-600/[0.02] transition-colors pointer-events-none" />
              </Link>
            </div>

            {!collapsed && hasSubItems && isExpanded && (
              <div className="mt-1 ml-7 pl-5 border-l-2 border-gray-50 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {item.subItems!.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const subActive = pathname === subItem.href;

                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={onLinkClick}
                      className={cn(
                        "group/sub flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-200",
                        subActive
                          ? "text-blue-600 bg-blue-50/30"
                          : "text-gray-400 hover:text-gray-900 hover:bg-gray-50",
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        subActive ? "bg-blue-600 scale-125" : "bg-gray-200 group-hover/sub:bg-gray-400 group-hover/sub:scale-110"
                      )} />
                      <span className="flex-1 truncate">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

import { ChevronDown } from "lucide-react";


