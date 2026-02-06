import { ArrowRight, Briefcase, FolderKanban, Network, Activity, Zap, Cpu } from "lucide-react";
import Link from "next/link";

const cards = [
  {
    icon: Briefcase,
    label: "Projects",
    title: "프로젝트 아카이브",
    description: "SI 사업본부의 전체 프로젝트Lifecycle 및 히스토리를 한눈에 조망합니다.",
    href: "/projects",
    color: "slate",
    stats: "24 Active"
  },
  {
    icon: FolderKanban,
    label: "Delivery",
    title: "과제 실행 엔진",
    description: "실시간 과제 추적, 마일스톤 달성율 및 리스크를 체계적으로 모니터링합니다.",
    href: "/delivery",
    color: "blue",
    stats: "92% Velocity"
  },
  {
    icon: Network,
    label: "Intelligence",
    title: "리소스 관리 체계",
    description: "핵심 인력의 역량과 기술 자산을 프로젝트 파이프라인과 정밀하게 매칭합니다.",
    href: "/resources",
    color: "indigo",
    stats: "88% Load"
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <section className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-10 h-[1.5px] bg-slate-200" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
            Command Center / Overview
          </p>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl italic">
          WEWORKS <span className="text-slate-200 font-extralight not-italic">|</span> 사업본부 통합 관제 보드
        </h1>
        <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic opacity-80">
          Enterprise Operation Console for Project Management, Resource Allocation, and Financial Integrity.
        </p>
      </section>

      <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group relative bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-slate-100/50 hover:bg-white"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex h-full flex-col justify-between gap-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-100 group-hover:rotate-[360deg] transition-transform duration-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic group-hover:text-slate-900 transition-colors">
                        {card.label}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Online</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-200 transition-all group-hover:translate-x-1 group-hover:text-slate-900" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">
                      {card.title}
                    </h2>
                    <p className="text-[13px] font-bold leading-relaxed text-slate-400 italic opacity-80">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase italic">{card.stats}</span>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((v) => (
                        <div key={v} className="w-6 h-6 rounded-lg bg-slate-50 border border-white flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                <Icon size={80} strokeWidth={1} />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Secondary Quick Stats */}
      <section className="grid gap-6 md:grid-cols-4 pt-4">
        {[
          { label: "Active Revenue", value: "₩14.2B", icon: Activity, change: "+12%" },
          { label: "Pipeline M/D", value: "2,480", icon: Zap, change: "Stable" },
          { label: "System Load", value: "74%", icon: Cpu, change: "-4%" },
          { label: "Department Net", value: "18.4%", icon: Activity, change: "+2.1%" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/40 p-6 rounded-[2rem] border border-slate-100/50 flex flex-col gap-3 group/stat hover:bg-white transition-all duration-300">
            <div className="flex items-center justify-between">
              <stat.icon className="w-4 h-4 text-slate-300 group-hover/stat:text-slate-900 transition-colors" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{stat.change}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 font-mono italic">{stat.value}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
