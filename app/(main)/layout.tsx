"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { Search, Menu, X, ChevronLeft } from "lucide-react";
import { SearchInput } from "@/components/ui";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="min-h-screen bg-background text-slate-800 font-sans selection:bg-indigo-50 selection:text-indigo-600">
      <div className="flex h-screen overflow-hidden relative">
        {/* Desktop Sidebar - Minimal & Integrated */}
        <aside
          className={cn(
            "hidden bg-white transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] md:block relative z-30 border-r border-slate-100/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
            sidebarCollapsed ? "w-20 px-3" : "w-64 px-4"
          )}
        >
          <div className={cn(
            "flex h-20 shrink-0 items-center overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "justify-center" : "justify-between px-2"
          )}>
            {!sidebarCollapsed ? (
              <div className="flex w-full items-center justify-between gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                <Link href="/dashboard" className="flex items-center gap-2 group/logo py-2">
                  <div className="flex items-center justify-center transition-transform duration-300 group-hover/logo:scale-105">
                    <img src="/weworks.png" alt="WEWORKS" className="h-[28px] object-contain" />
                  </div>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <img src="/weworks.png" alt="W" className="h-[20px] w-auto object-contain" />
              </button>
            )}
          </div>

          <div className="py-6 h-[calc(100%-5rem)] overflow-y-auto custom-scrollbar">
            <Sidebar
              collapsed={sidebarCollapsed}
              onExpand={() => setSidebarCollapsed(false)}
            />
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-slate-100 px-6 py-8 transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] md:hidden",
            mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 py-1">
              <img src="/weworks.png" alt="WEWORKS" className="h-[24px] object-contain" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-all active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto relative custom-scrollbar-main">
          <header className="flex h-20 shrink-0 items-center justify-between bg-white px-4 sm:px-6 z-20 border-b border-slate-100/60">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all md:hidden active:scale-95 shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </button>

              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100/80 text-slate-400 transition-all active:scale-95 group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}

              <div className="flex flex-col ml-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  사업본부 통합 시스템
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center w-80">
                <SearchInput
                  placeholder="통합 검색..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                <div className="flex flex-col items-end mr-1 text-right hidden sm:flex">
                  <span className="text-[11px] font-black text-slate-900 leading-tight">황해운 팀장</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 italic leading-none opacity-70">Management</span>
                </div>
                <div className="relative group/user cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-900 text-[11px] font-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover/user:shadow-md transition-all duration-300 ring-4 ring-slate-50">
                    HW
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 relative z-10 bg-[#FBFBFC]">
            <div className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
