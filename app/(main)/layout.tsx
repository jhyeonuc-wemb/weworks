"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { Search, Menu, X, ChevronLeft, LogOut, User } from "lucide-react";
import { SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { UserProfilePanel } from "@/components/UserProfilePanel";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role?: string;
  rank?: string; // 직급
  position?: string; // 직책
  department?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profileTriggerRect, setProfileTriggerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });

      if (res.ok) {
        setUser(null);
        showToast("로그아웃 되었습니다.", "success");
        router.push('/login');
        router.refresh();
      } else {
        showToast("로그아웃 중 오류가 발생했습니다.", "error");
      }
    } catch (e) {
      console.error("Logout failed", e);
      showToast("로그아웃 중 오류가 발생했습니다.", "error");
    }
  };

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
          <header className="flex h-20 shrink-0 items-center justify-between bg-white px-4 sm:px-6 z-20 border-b border-slate-100/60 sticky top-0">
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
                  프로젝트 통합관리 시스템
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

              <div className="flex items-center gap-4 border-l border-slate-100 pl-6 relative">
                {user ? (
                  <div className="flex items-center gap-6">
                    <div
                      className="flex flex-col items-end text-right cursor-pointer hover:bg-indigo-50 px-3 py-1 -mr-2 rounded-xl transition-all group"
                      onClick={(e) => {
                        setProfileTriggerRect(e.currentTarget.getBoundingClientRect());
                        setShowProfilePanel(true);
                      }}
                    >
                      <span className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {user.name} <span className="text-slate-600 font-medium ml-1 group-hover:text-indigo-500 transition-colors">{user.rank} {user.position && `(${user.position})`}</span>
                      </span>
                      <span className="text-[12px] font-medium text-slate-500 mt-0.5 max-w-[240px] truncate">
                        {user.department || '부서 미지정'}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 relative z-10 bg-[#FBFBFC]">
            {/* User Profile Modal */}
            {showProfilePanel && user && (
              <UserProfilePanel
                user={user}
                open={showProfilePanel}
                onOpenChange={setShowProfilePanel}
                onLogout={handleLogout}
                triggerRect={profileTriggerRect}
              />
            )}

            <div className="w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
