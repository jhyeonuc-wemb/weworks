"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SIDEBAR_MENU, hasChildren, type SidebarMenuItem } from "@/lib/menu-config";

interface SidebarProps {
  onLinkClick?: () => void;
  onExpand?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onLinkClick, onExpand, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const item = SIDEBAR_MENU.find(
      (i) =>
        hasChildren(i) &&
        (pathname === i.href ||
          pathname?.startsWith(i.href + "/") ||
          i.children!.some(
            (sub) => pathname === sub.href || pathname?.startsWith(sub.href + "/")
          ))
    );
    return item ? [item.href] : [];
  });

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const handleClick = (e: React.MouseEvent, item: SidebarMenuItem) => {
    if (hasChildren(item)) {
      e.preventDefault();
      toggleExpand(item.href);
    }
    if (collapsed && onExpand) {
      onExpand();
    } else if (onLinkClick && !hasChildren(item)) {
      onLinkClick();
    }
  };

  return (
    <nav className="flex flex-col gap-1">
      {SIDEBAR_MENU.map((item) => {
        const Icon = item.icon;
        const isGroup = hasChildren(item);
        const hasActiveChild =
          isGroup &&
          item.children!.some(
            (sub) => pathname === sub.href || pathname?.startsWith(sub.href + "/")
          );
        const active =
          hasActiveChild ||
          pathname === item.href ||
          (item.href !== "/dashboard" && !isGroup && pathname?.startsWith(item.href));
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
                    ? isGroup
                      ? "bg-slate-900 text-white"
                      : "bg-slate-900 text-white shadow-xl shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  collapsed && "justify-center px-0 h-10 w-10 mx-auto"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                    active
                      ? "text-white"
                      : "bg-slate-100 group-hover/item:bg-white group-hover/item:shadow-sm text-slate-400 group-hover/item:text-slate-900"
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 3 : 2.5} />
                </div>

                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

                {!collapsed && isGroup && (
                  <div
                    className={cn(
                      "p-1 rounded-lg transition-all duration-300 ml-auto",
                      isExpanded && "rotate-180",
                      active
                        ? isExpanded
                          ? "bg-white/20 text-white group-hover/item:bg-white/40"
                          : "text-slate-400 group-hover/item:text-white"
                        : isExpanded
                          ? "bg-slate-100 text-slate-700 group-hover/item:bg-slate-200"
                          : "text-slate-400 group-hover/item:text-slate-700 group-hover/item:bg-slate-100"
                    )}
                  >
                    <ChevronDown size={12} strokeWidth={3} />
                  </div>
                )}
              </Link>
            </div>

            {!collapsed && isGroup && isExpanded && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-300">
                {item.children!.map((subItem) => {
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
                          : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-1 h-1 rounded-full transition-all duration-300",
                          subActive
                            ? "bg-slate-900 scale-150 shadow-sm"
                            : "bg-slate-200 group-hover/sub:bg-slate-400"
                        )}
                      />
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
