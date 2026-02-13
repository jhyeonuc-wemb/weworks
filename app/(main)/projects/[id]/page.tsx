"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Settings,
  ArrowLeft,
  Edit,
  Shield,
  Calculator,
  Trash2,
  Save,
  X,
  Folder,
  XCircle,
  Handshake,
  Lightbulb,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Currency } from "@/lib/utils/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { DatePicker, Dropdown, Button } from "@/components/ui";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

interface Project {
  id: number;
  project_code: string | null;
  name: string;
  customer_name: string | null;
  orderer_name: string | null;
  customer_id: number | null;
  orderer_id: number | null;
  category_id: number | null;
  description: string | null;
  status: string;
  current_phase: string | null;
  manager_name: string | null;
  manager_id: number | null;
  sales_representative_name: string | null;
  sales_representative_id: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  currency: string;
  expected_amount: number | null;
  process_status: string | null;
  risk_level: string | null;
  category_name: string | null;
  field_id: number | null;
  field_name: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
}

interface Client {
  id: number;
  name: string;
  type: string;
}

interface ProjectCategory {
  id: number;
  code: string;
  name: string;
}


const PHASE_ICONS: Record<string, any> = {
  lead: Lightbulb,
  opportunity: Lightbulb,
  md_estimation: FileText,
  vrb: CheckCircle2,
  contract: Handshake,
  profitability: DollarSign,
  in_progress: Settings,
  settlement: FileText,
  warranty: Shield,
  paid_maintenance: Wrench,
};

// Legacy Status -> Phase Code Mapping
const LEGACY_STATUS_TO_PHASE: Record<string, string> = {
  sales_opportunity: 'lead',
  sales: 'opportunity',
  md_estimation: 'md_estimation',
  md_estimated: 'vrb',
  vrb_review: 'vrb',
  vrb_approved: 'contract',
  vrb_rejected: 'vrb',
  team_allocation: 'profitability',
  profitability_analysis: 'profitability',
  profitability_completed: 'profitability',
  profitability_review: 'profitability',
  profitability_approved: 'in_progress',
  profitability_rejected: 'profitability',
  in_progress: 'in_progress',
  on_hold: 'in_progress',
  completed: 'settlement',
  settlement: 'settlement',
  settlement_completed: 'settlement',
  settlement_review: 'settlement',
  settlement_approved: 'warranty',
  settlement_rejected: 'settlement',
  warranty: 'warranty',
  warranty_completed: 'warranty',
  cancelled: 'lead',
};

function getCurrentStepIndex(phases: any[], currentPhaseCode: string, status: string): number {
  if (!phases || phases.length === 0) return 0;

  // 1. Try exact match with currentPhaseCode
  let index = phases.findIndex(p => p.code === currentPhaseCode);
  if (index !== -1) return index;

  // 2. Try legacy mapping
  const mappedPhase = LEGACY_STATUS_TO_PHASE[status];
  if (mappedPhase) {
    index = phases.findIndex(p => p.code === mappedPhase);
  }

  return index !== -1 ? index : 0;
}

function getStepStatus(
  stepIndex: number,
  currentStepIndex: number,
  status: string,
  stepCode: string
): "completed" | "current" | "pending" | "rejected" {
  // VRB 단계에서 반려된 경우
  if (stepCode === "vrb" && status === "vrb_rejected") {
    return "rejected";
  }

  if (stepIndex < currentStepIndex) {
    return "completed";
  }
  if (stepIndex === currentStepIndex) {
    return "current";
  }
  return "pending";
}

function getNextAction(status: string, currentPhase: string, projectId: string, phases: any[]) {
  // 1. VRB 반려 시 프로세스 동결
  if (status === "vrb_rejected") return null;

  // 2. 현재 단계(currentPhase) 기반 다음 액션 매핑
  // DB의 current_phase 컬럼 값을 우선으로 하되, status가 상세 상태(완료/승인 등)를 나타내면 이를 반영

  // 수지분석 승인됨 -> 프로젝트 진행 중
  if (status === "profitability_approved" || currentPhase === "in_progress") {
    return {
      label: "수지정산서 작성",
      href: `/projects/${projectId}/settlement`,
      action: "settlement",
    };
  }

  // 수지분석 완료됨 -> 승인 요청 대기
  if (status === "profitability_completed") {
    return {
      label: "수지분석서 승인 요청",
      href: `/projects/${projectId}/profitability/review`,
      action: "profitability_review",
    };
  }

  // VRB 승인됨 or 계약 단계 -> 수지분석 작성
  if (status === "vrb_approved" || currentPhase === "contract" || currentPhase === "profitability") {
    return {
      label: "수지분석서 작성",
      href: `/projects/${projectId}/profitability`,
      action: "profitability_analysis",
    };
  }

  // M/D 산정 완료됨 -> VRB 작성
  if (status === "md_estimated" || currentPhase === "vrb") {
    return {
      label: "VRB 작성",
      href: `/projects/${projectId}/vrb-review`,
      action: "vrb_review",
    };
  }

  // 리드/영업기회 단계 -> M/D 산정
  if (currentPhase === "lead" || currentPhase === "opportunity" || currentPhase === "md_estimation" || status === "sales" || status === "sales_opportunity") {
    return {
      label: "M/D 산정",
      href: `/projects/${projectId}/md-estimation`,
      action: "md_estimation",
    };
  }

  // 정산 단계 관련
  if (status === "settlement_completed" || status === "settlement") {
    return {
      label: "수지정산서 승인 요청",
      href: `/projects/${projectId}/settlement/review`,
      action: "settlement_review",
    };
  }

  if (status === "settlement_approved" || currentPhase === "warranty") {
    return {
      label: "하자보증 관리",
      href: "#",
      action: "warranty",
    };
  }

  return null;
}

// 날짜 포맷팅 함수 (YYYY-MM-DD 형식으로 통일)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // 유효하지 않은 날짜면 원본 반환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString; // 파싱 실패 시 원본 반환
  }
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 편집 모달 데이터
  const [phases, setPhases] = useState<any[]>([]);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      const response = await fetch("/api/settings/phases", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setPhases(data.phases?.filter((p: any) => p.is_active) || []);
      }
    } catch (error) {
      console.error("Error fetching phases:", error);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        console.error("Failed to fetch project");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  // 편집 저장 (ProjectModal용)
  const handleSaveProject = async (data: any) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        await fetchProject(); // 프로젝트 정보 새로고침
        alert("프로젝트가 수정되었습니다.");
      } else {
        const error = await response.json();
        alert(`프로젝트 수정 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error updating project:", error);
      alert(`프로젝트 수정 실패: ${error.message}`);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("프로젝트가 삭제되었습니다.");
        router.push("/projects");
      } else {
        const error = await response.json();
        alert(`프로젝트 삭제 실패: ${error.message || "알 수 없는 오류"}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("프로젝트 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(phases, project.current_phase || project.process_status || "", project.status);
  const nextAction = getNextAction(project.status, project.current_phase || "", id, phases);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* 헤더 - Neo Detail Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {project.name}
            </h1>
            <p className="text-sm text-gray-600">
              {project.project_code} | {project.customer_name}
              {project.orderer_name && project.orderer_name !== project.customer_name && ` | ${project.orderer_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setIsEditModalOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            수정
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* 워크플로우 단계 표시 - Neo Stepper */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-[3rem] blur-lg opacity-40" />
        <div className="relative rounded-[2.5rem] border border-gray-100 bg-white px-10 pb-10 pt-8 shadow-2xl shadow-blue-50/50">


          <div className="relative flex items-center justify-between gap-4">
            {phases.map((step, index) => {
              const Icon = PHASE_ICONS[step.code] || FileText;
              const stepStatus = getStepStatus(index, currentStepIndex, project.status, step.code);
              const isLast = index === phases.length - 1;
              const isVrbStep = step.code === "vrb";
              const isVrbApproved = isVrbStep && project.status === "vrb_approved";
              const isVrbRejected = isVrbStep && project.status === "vrb_rejected";
              const isBlocked = isVrbRejected && index > currentStepIndex;

              const statusConfigs: Record<string, { ring: string, bg: string, text: string, iconColor: string }> = {
                rejected: { ring: "ring-red-100", bg: "bg-red-50", text: "text-red-700", iconColor: "text-red-500" },
                completed: { ring: "ring-emerald-100", bg: "bg-emerald-50", text: "text-emerald-700", iconColor: "text-emerald-500" },
                current: { ring: "ring-blue-100", bg: "bg-blue-600", text: "text-blue-900", iconColor: "text-white" },
                pending: { ring: "ring-gray-100", bg: "bg-gray-50", text: "text-gray-400", iconColor: "text-gray-300" },
                blocked: { ring: "ring-gray-50", bg: "bg-gray-50/50", text: "text-gray-200", iconColor: "text-gray-200" }
              };

              let currentConfig = statusConfigs[stepStatus];
              if (isVrbRejected) currentConfig = statusConfigs.rejected;
              if (isVrbApproved) currentConfig = statusConfigs.completed;
              if (isBlocked) currentConfig = statusConfigs.blocked;

              const showGroupLabel = index === 0 || phases[index - 1].phase_group !== step.phase_group;
              const groupLabel = step.phase_group === 'sales_ps' ? '영업/PS' : step.phase_group === 'maintenance' ? '유지보수' : '프로젝트';

              return (
                <div key={step.id} className="flex-1 relative flex flex-col items-center group/step mt-12">
                  {/* Phase Group Label */}
                  {showGroupLabel && (
                    <div className="absolute -top-10 left-0 right-0 flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border",
                        step.phase_group === 'sales_ps'
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : step.phase_group === 'maintenance'
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {groupLabel}
                      </span>
                    </div>
                  )}

                  {/* Connector Line */}
                  {!isLast && (
                    <div className="absolute top-[22px] left-[50%] w-full h-[3px] z-0">
                      <div className={cn(
                        "h-full w-full rounded-full transition-all duration-700",
                        index < currentStepIndex ? "bg-gradient-to-r from-emerald-400 to-emerald-400" : "bg-gray-100"
                      )} />
                      {stepStatus === "current" && (
                        <div className="absolute inset-0 bg-blue-600/20 w-1/2 animate-in slide-in-from-left duration-1000 fill-mode-forwards" />
                      )}
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col items-center">
                    {(() => {
                      const getStepUrl = (code: string) => {
                        switch (code) {
                          case 'md_estimation':
                            return `/projects/${id}/md-estimation`;
                          case 'vrb':
                            return `/projects/${id}/vrb-review`;
                          case 'profitability':
                            return `/projects/${id}/profitability`;
                          case 'settlement':
                            return `/projects/${id}/settlement`;
                          default:
                            return null;
                        }
                      };

                      const stepUrl = getStepUrl(step.code);
                      const isClickable = stepUrl !== null;

                      const content = (
                        <>
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-500 ring-4 shadow-lg group-hover/step:translate-y-[-2px]",
                            currentConfig.bg,
                            currentConfig.ring,
                            stepStatus === "current" && "shadow-xl shadow-blue-200 animate-pulse-slow",
                            isClickable && "cursor-pointer hover:scale-110"
                          )}>
                            {stepStatus === "rejected" || isVrbRejected ? (
                              <XCircle size={22} strokeWidth={2.5} className={currentConfig.iconColor} />
                            ) : stepStatus === "completed" || isVrbApproved ? (
                              <CheckCircle2 size={22} strokeWidth={2.5} className={currentConfig.iconColor} />
                            ) : stepStatus === "current" ? (
                              <div className="relative">
                                <Clock size={22} strokeWidth={3} className={currentConfig.iconColor} />
                                {/* Orbiting dot */}
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-blue-600" />
                              </div>
                            ) : (
                              <Icon size={18} strokeWidth={2.5} className={currentConfig.iconColor} />
                            )}
                          </div>

                          <div className="mt-4 flex flex-col items-center gap-1">
                            <span className="text-sm font-medium text-gray-900 text-center break-keep">
                              {step.name}
                            </span>
                            {stepStatus === "current" && (
                              <span className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest animate-pulse">Running...</span>
                            )}
                          </div>
                        </>
                      );

                      return isClickable ? (
                        <Link href={stepUrl} className="flex flex-col items-center">
                          {content}
                        </Link>
                      ) : (
                        <div className="flex flex-col items-center">
                          {content}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Hub */}
          <div className="mt-12 flex flex-col items-center gap-6 p-8 rounded-3xl bg-gray-50/50 border border-gray-100 relative overflow-hidden group/action">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover/action:translate-x-0 group-hover/action:translate-y-0 transition-transform duration-700">
              <Settings size={120} />
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">시스템 권장 다음 작업 단계</h3>
            </div>

            {nextAction ? (
              <Link
                href={nextAction.href}
                className="group relative inline-flex items-center gap-4 rounded-2xl bg-gray-900 border-2 border-transparent px-10 py-4 text-sm font-black text-white shadow-2xl hover:bg-white hover:text-gray-900 hover:border-gray-900 transition-all duration-300 z-10 active:scale-95 overflow-hidden"
              >
                <span>{nextAction.label} 실행하기</span>
                <Edit size={16} strokeWidth={3} />
                <div className="absolute inset-0 bg-white/10 -translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              </Link>
            ) : project.status === "vrb_rejected" ? (
              <div className="flex items-center gap-3 px-8 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
                <XCircle size={20} strokeWidth={3} />
                <span className="text-sm font-black italic">VRB 심의 반려로 인해 프로세스가 동결되었습니다</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700">
                <CheckCircle2 size={20} strokeWidth={3} />
                <span className="text-sm font-black italic">모든 워크플로우를 성공적으로 완료했습니다</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 프로젝트 기본 정보 - Neo Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {[
          { label: "분야(EESD)", value: project.category_name, icon: Folder, color: "blue" },
          { label: "영역", value: project.field_name, icon: Folder, color: "violet" },
          { label: "PM", value: project.manager_name, icon: Users, color: "indigo" },
          { label: "영업대표", value: project.sales_representative_name, icon: Users, color: "violet" },
          {
            label: "계약기간",
            value: (
              <div className="flex flex-col text-sm text-gray-900">
                <span>{formatDate(project.contract_start_date)}</span>
                <span>~ {formatDate(project.contract_end_date)}</span>
              </div>
            ),
            icon: Calendar, color: "emerald"
          },
          { label: "인력현황", value: "0명", icon: Users, color: "sky" },
          {
            label: "위험도",
            value: (
              <span className={cn(
                "font-bold tracking-widest",
                project.risk_level === "high" ? "text-red-600" :
                  project.risk_level === "medium" ? "text-amber-600" :
                    project.risk_level === "low" ? "text-emerald-600" : "text-gray-900"
              )}>
                {project.risk_level === "high" ? "상" :
                  project.risk_level === "medium" ? "중" :
                    project.risk_level === "low" ? "하" : "-"}
              </span>
            ),
            icon: Shield, color: "rose"
          },

        ].map((info, i) => (
          <div
            key={i}
            className="group/card relative bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-blue-50/20 overflow-hidden hover:scale-[1.05] hover:shadow-2xl transition-all duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={cn(
              "absolute -top-4 -right-4 w-20 h-20 opacity-[0.03] transition-transform duration-700 group-hover/card:scale-150 rotate-12",
              info.color === "blue" ? "text-blue-600" :
                info.color === "indigo" ? "text-indigo-600" :
                  info.color === "violet" ? "text-violet-600" :
                    info.color === "emerald" ? "text-emerald-600" :
                      info.color === "sky" ? "text-sky-600" : "text-rose-600"
            )}>
              <info.icon size={100} />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  info.color === "blue" ? "bg-blue-50 text-blue-600" :
                    info.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                      info.color === "violet" ? "bg-violet-50 text-violet-600" :
                        info.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                          info.color === "sky" ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600"
                )}>
                  <info.icon size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-500">{info.label}</span>
              </div>
              <div className="text-base font-semibold text-gray-900 leading-tight break-keep">
                {info.value || "-"}
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* 편집 모달 - ProjectModal 사용 */}
      <ProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={project}
        onSave={handleSaveProject}
      />
    </div>
  );
}
