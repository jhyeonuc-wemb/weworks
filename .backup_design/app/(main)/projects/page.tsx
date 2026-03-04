"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, FolderGit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatPercent } from "@/lib/utils/format";

// 날짜 포맷팅 함수 (YYYY-MM-DD 형식으로 통일)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    // ISO 형식의 날짜 문자열 처리
    const dateStr = dateString.split('T')[0]; // ISO 형식에서 날짜 부분만 추출
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateString; // 유효하지 않은 날짜면 원본 반환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    return dateString; // 파싱 실패 시 원본 반환
  }
};

interface Project {
  id: number;
  project_code: string | null;
  name: string;
  customer_name: string | null;
  orderer_name: string | null;
  status: string;
  current_phase: string | null;
  manager_name: string | null;
  sales_representative_name: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  net_profit?: number;
  profit_rate?: number;
}

// 임시 프로젝트 데이터 (fallback)
const defaultProjects: Project[] = [
  {
    id: 1,
    project_code: "P24-039",
    name: "KOEN 스마트 도면관리시스템 구축 용역",
    customer_name: "한국남동발전",
    orderer_name: "한국남동발전",
    status: "profitability_approved",
    current_phase: "in_progress",
    manager_name: "홍길동",
    sales_representative_name: "김철수",
    contract_start_date: "2024-01-01",
    contract_end_date: "2024-12-31",
  },
  {
    id: 2,
    project_code: "P25-019",
    name: "고성 천연가스발전사업 디지털 트윈 구축 용역",
    customer_name: "한국전력공사",
    orderer_name: "한국전력기술",
    status: "md_estimated",
    current_phase: "vrb",
    manager_name: "김철수",
    sales_representative_name: "박민수",
    contract_start_date: "2025-03-01",
    contract_end_date: "2026-02-28",
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-700" },
  md_estimation: { label: "M/D 산정 중", color: "bg-blue-100 text-blue-700" },
  md_estimated: { label: "M/D 산정 완료", color: "bg-blue-100 text-blue-700" },
  vrb_review: { label: "VRB 중", color: "bg-yellow-100 text-yellow-700" },
  vrb_approved: { label: "VRB 승인", color: "bg-green-100 text-green-700" },
  vrb_rejected: { label: "VRB 반려", color: "bg-red-100 text-red-700" },
  confirmed: { label: "컨펌 완료", color: "bg-green-100 text-green-700" },
  profitability_analysis: { label: "수지분석서 작성 중", color: "bg-purple-100 text-purple-700" },
  profitability_completed: { label: "수지분석서 작성 완료", color: "bg-purple-100 text-purple-700" },
  profitability_review: { label: "수지분석서 검토 중", color: "bg-yellow-100 text-yellow-700" },
  profitability_approved: { label: "수지분석서 승인", color: "bg-green-100 text-green-700" },
  profitability_rejected: { label: "수지분석서 반려", color: "bg-red-100 text-red-700" },
  in_progress: { label: "진행 중", color: "bg-blue-100 text-blue-700" },
  on_hold: { label: "보류", color: "bg-gray-100 text-gray-700" },
  completed: { label: "완료", color: "bg-gray-100 text-gray-700" },
  settlement: { label: "수지정산서 작성 중", color: "bg-orange-100 text-orange-700" },
  settlement_completed: { label: "수지정산서 작성 완료", color: "bg-orange-100 text-orange-700" },
  settlement_review: { label: "수지정산서 검토 중", color: "bg-yellow-100 text-yellow-700" },
  settlement_approved: { label: "수지정산서 승인", color: "bg-green-100 text-green-700" },
  settlement_rejected: { label: "수지정산서 반려", color: "bg-red-100 text-red-700" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700" },
};

const phaseLabels: Record<string, string> = {
  sales: "영업/PS",
  md_estimation: "M/D 산정",
  vrb: "VRB",
  confirmation: "컨펌",
  team_allocation: "인력 배치",
  profitability: "수지분석서",
  in_progress: "프로젝트 진행",
  settlement: "수지정산서",
  warranty: "하자보증",
};

const sortOptions = [
  { value: "project_code_desc", label: "프로젝트 코드순 (최신)" },
  { value: "profit_high", label: "예상손익 높은 순" },
  { value: "profit_low", label: "예상손익 낮은 순" },
  { value: "rate_high", label: "예상수익률 높은 순" },
  { value: "rate_low", label: "예상수익률 낮은 순" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("project_code_desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      switch (sortOption) {
        case "profit_high":
          return (b.net_profit || 0) - (a.net_profit || 0);
        case "profit_low":
          return (a.net_profit || 0) - (b.net_profit || 0);
        case "rate_high":
          return (b.profit_rate || 0) - (a.profit_rate || 0);
        case "rate_low":
          return (a.profit_rate || 0) - (b.profit_rate || 0);
        case "project_code_desc":
        default:
          if (!a.project_code) return 1;
          if (!b.project_code) return -1;
          return b.project_code.localeCompare(a.project_code);
      }
    });
  }, [projects, sortOption]);

  useEffect(() => {
    fetchProjects();
  }, [searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        setProjects(defaultProjects);
      }
    } catch (error) {
      setProjects(defaultProjects);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Project Archive
            </h1>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-4">
            전체 프로젝트 목록 및 현황 관리
          </p>
        </div>

        <Link
          href="/projects/new"
          className="group relative inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={18} strokeWidth={3} />
          <span>신규 프로젝트 생성</span>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-xl shadow-blue-50/50 relative z-30">
        <div className="relative flex-1 group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="프로젝트명, 코드, 고객사로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 border-none rounded-3xl py-4 pl-14 pr-6 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all shadow-sm group-hover:shadow-md"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Custom Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white px-6 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm active:scale-95"
            >
              <ArrowUpDown size={16} className="text-blue-600" />
              <span>{sortOptions.find(opt => opt.value === sortOption)?.label}</span>
              <ChevronDown size={14} className={cn("text-gray-300 transition-transform", showSortDropdown && "rotate-180")} />
            </button>

            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 z-20 mt-3 w-64 rounded-3xl border border-gray-50 bg-white shadow-2xl py-3 animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
                  <div className="px-5 py-2 mb-1 border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sort Options</span>
                  </div>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3 text-left text-[13px] font-bold transition-colors",
                        sortOption === option.value
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white px-6 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm active:scale-95 group">
            <Filter size={16} className="text-gray-400 group-hover:text-blue-600" />
            <span>상세 필터</span>
          </button>
        </div>
      </div>

      {/* Projects List Card */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-100/20 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-main">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">프로젝트 정보</th>
                <th className="px-6 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">예상 손익</th>
                <th className="px-6 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">수익률</th>
                <th className="px-6 py-6 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">고객사 / 발주처</th>
                <th className="px-6 py-6 text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">상태</th>
                <th className="px-6 py-6 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">담당 인력</th>
                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400 italic">안전하게 데이터를 불러오는 중...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200">
                        <FolderGit2 size={40} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-black text-gray-900 italic">등록된 프로젝트가 없습니다</p>
                        <p className="text-sm font-bold text-gray-400 italic">신규 프로젝트를 생성하여 관리를 시작하세요</p>
                      </div>
                      <Link
                        href="/projects/new"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white hover:bg-gray-800 transition-all"
                      >
                        <Plus size={16} strokeWidth={3} />
                        생성하기
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedProjects.map((project, idx) => {
                  const phase = project.current_phase || "sales";
                  const phaseLabel = phaseLabels[phase] || phase || "-";
                  const phaseConfig: Record<string, { bg: string, text: string, dot: string }> = {
                    sales: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-600" },
                    md_estimation: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-600" },
                    vrb: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-600" },
                    confirmation: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-600" },
                    team_allocation: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-600" },
                    profitability: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-600" },
                    in_progress: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-600" },
                    settlement: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-600" },
                  };
                  const config = phaseConfig[phase] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };

                  return (
                    <tr
                      key={project.id}
                      className="group cursor-pointer hover:bg-blue-50/30 transition-all duration-300"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-10 py-7">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-base font-black text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                            {project.name}
                          </span>
                          {project.project_code && (
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-100 text-[10px] font-black text-gray-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                {project.project_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-7 text-right">
                        <span className="text-sm font-black text-gray-900 font-mono">
                          {project.net_profit ? formatCurrency(project.net_profit * 1000, "KRW") : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-7 text-right">
                        <div className={cn(
                          "inline-flex items-center px-2 py-1 rounded-lg text-xs font-black font-mono",
                          (project.profit_rate || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {project.profit_rate ? formatPercent(project.profit_rate) : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-7">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">{project.customer_name || "-"}</span>
                          {project.orderer_name && project.orderer_name !== project.customer_name && (
                            <span className="text-[10px] font-black text-gray-300 uppercase mt-0.5 italic">{project.orderer_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-7 text-center">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-[1.25rem] text-[11px] font-black shadow-sm transition-all group-hover:shadow-md",
                          config.bg,
                          config.text
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dot)} />
                          {phaseLabel}
                        </div>
                      </td>
                      <td className="px-6 py-7">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400">
                            {project.manager_name?.slice(0, 1) || "?"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-gray-900 leading-none">{project.manager_name || "-"}</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase mt-1 italic">PM Analyst</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-black text-gray-900 italic">
                            {project.contract_start_date ? formatDate(project.contract_start_date) : "-"}
                          </span>
                          <span className="text-[11px] font-black text-gray-300 italic -mt-0.5">
                            {project.contract_end_date ? formatDate(project.contract_end_date) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
