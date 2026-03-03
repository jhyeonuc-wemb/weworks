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
  Handshake,
  Lightbulb,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Currency, formatCurrency } from "@/lib/utils/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { DatePicker, Dropdown, Button, StatusBadge, useToast } from "@/components/ui";
import type { AlertType } from "@/components/ui";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { ProjectAiAnalysis } from "./components/ProjectAiAnalysis";

interface Project {
  id: number;
  projectCode: string | null;
  name: string;
  customerName: string | null;
  ordererName: string | null;
  customerId: number | null;
  ordererId: number | null;
  category_id: number | null;
  description: string | null;
  status: string;
  currentPhase: string | null;
  managerName: string | null;
  managerId: number | null;
  salesRepresentativeName: string | null;
  salesRepresentativeId: number | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  currency: string;
  expectedAmount: number | null;
  processStatus: string | null;
  riskLevel: string | null;
  categoryName: string | null;
  field_id: number | null;
  fieldName: string | null;
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

// Legacy Status → Phase Code Mapping (삭제됨 - phase-status API 사용)

function getCurrentStepIndex(phases: any[], currentPhaseCode: string): number {
  if (!phases || phases.length === 0) return 0;
  const index = phases.findIndex(p => p.code === currentPhaseCode);
  return index !== -1 ? index : 0;
}


/** phaseProgress의 status → 스테퍼 표시 상태 변환 */
function toStepperStatus(phaseStatus: string): "completed" | "current" | "pending" {
  if (phaseStatus === 'COMPLETED') return 'completed';
  if (phaseStatus === 'IN_PROGRESS') return 'current';
  return 'pending';
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

  const { showToast, confirm } = useToast();

  const showAlert = (message: string, type: AlertType = "info", title?: string, onConfirm?: () => void) => {
    if (type === "confirm") {
      confirm({
        message,
        title,
        onConfirm: onConfirm!,
      });
    } else {
      showToast(message, type as any, title);
      if (onConfirm) {
        setTimeout(onConfirm, 500);
      }
    }
  };

  // 단계별 진행 상태 (we_project_phase_progress 기반)
  const [phaseProgress, setPhaseProgress] = useState<any[]>([]);
  const [currentPhaseCode, setCurrentPhaseCode] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchPhaseProgress();
  }, [id]);

  const fetchPhaseProgress = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/phase-status`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPhaseProgress(data.phases || []);
        setCurrentPhaseCode(data.currentPhaseCode);
      }
    } catch (error) {
      console.error('Error fetching phase progress:', error);
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
        showAlert("프로젝트가 수정되었습니다.", "success");
      } else {
        const error = await response.json();
        showAlert(`프로젝트 수정 실패: ${error.message || "알 수 없는 오류"}`, "error");
      }
    } catch (error: any) {
      console.error("Error updating project:", error);
      showAlert(`프로젝트 수정 실패: ${error.message}`, "error");
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    showAlert(
      "정말 이 프로젝트를 삭제하시겠습니까?\n\n수지분석서, VRB 심의, 수지정산서, 업무일지, 인력계획 등 프로젝트와 연관된 모든 데이터가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.",
      "confirm",
      "프로젝트 삭제",
      async () => {
        try {
          setIsDeleting(true);
          const response = await fetch(`/api/projects/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            showAlert("프로젝트가 삭제되었습니다.", "success", undefined, () => {
              router.push("/projects");
            });
          } else {
            const error = await response.json();
            showAlert(`프로젝트 삭제 실패: ${error.message || "알 수 없는 오류"}`, "error");
            setIsDeleting(false);
          }
        } catch (error) {
          console.error("Error deleting project:", error);
          showAlert("프로젝트 삭제 중 오류가 발생했습니다.", "error");
          setIsDeleting(false);
        }
      }
    );
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

  const currentStep = phaseProgress.find(p => p.code === (currentPhaseCode || project.currentPhase));
  const currentStepIndex = getCurrentStepIndex(phaseProgress, currentPhaseCode || project.currentPhase || '');

  // phase-status API의 path 기반 동적 next action 계산
  const nextAction = (() => {
    if (!currentStep || !currentStep.path) return null;
    const href = currentStep.path.replace(':id', id);
    return { label: currentStep.name, href };
  })();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* 헤더 - Neo Detail Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {project.name}
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              {project.projectCode} | {project.customerName}
              {project.ordererName && project.ordererName !== project.customerName && ` | ${project.ordererName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setIsEditModalOpen(true)} className="gap-2 shadow-md">
            <Edit className="h-4 w-4" />
            수정
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 text-red-600 hover:bg-red-50 shadow-md"
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


          <div className="relative flex items-start justify-between gap-4">
            {phaseProgress.map((step: any, index: number) => {
              const Icon = PHASE_ICONS[step.code] || FileText;
              const stepStatus = toStepperStatus(step.status);
              const isLast = index === phaseProgress.length - 1;

              const statusConfigs: Record<string, { ring: string, bg: string, text: string, iconColor: string }> = {
                completed: { ring: "ring-emerald-100", bg: "bg-emerald-50", text: "text-emerald-700", iconColor: "text-emerald-500" },
                current: { ring: "ring-blue-100", bg: "bg-blue-600", text: "text-blue-900", iconColor: "text-white" },
                pending: { ring: "ring-gray-100", bg: "bg-gray-50", text: "text-gray-400", iconColor: "text-gray-300" },
              };

              const currentConfig = statusConfigs[stepStatus];

              const showGroupLabel = index === 0 || phaseProgress[index - 1]?.phaseGroup !== step.phaseGroup;
              // groupName은 API에서 받아온 동적 값 사용
              const groupLabel = step.groupName || step.phaseGroup;

              return (
                <div key={step.code} className="flex-1 relative flex flex-col items-center group/step mt-12">
                  {/* Phase Group Label */}
                  {showGroupLabel && (
                    <div className="absolute -top-10 left-0 right-0 flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border",
                        step.phaseGroup === 'sales_ps'
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : step.phaseGroup === 'maintenance'
                            ? "bg-purple-50 text-purple-600 border-purple-100"
                            : step.phaseGroup === 'closure'
                              ? "bg-orange-50 text-orange-600 border-orange-100"
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
                          {/* 아이콘 — 모든 스텝 동일 높이 기준점 */}
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-500 ring-4 shadow-lg group-hover/step:translate-y-[-2px]",
                            currentConfig.bg,
                            currentConfig.ring,
                            stepStatus === "current" && "shadow-xl shadow-blue-200 animate-pulse-slow",
                            isClickable && "cursor-pointer hover:scale-110"
                          )}>
                            {stepStatus === "completed" ? (
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

                          {/* 단계명 — 고정 높이로 가로 정렬 */}
                          <div className="mt-3 flex flex-col items-center" style={{ minHeight: 36 }}>
                            <span className="text-sm font-medium text-gray-900 text-center break-keep leading-snug">
                              {step.name}
                            </span>
                            {stepStatus === "current" && (
                              <span className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest animate-pulse">Running...</span>
                            )}
                          </div>

                          {/* 날짜 — 단계명 아래 별도 영역 */}
                          {(step.date1 || step.date2) && (
                            <div className="mt-1 flex flex-col items-center gap-0.5">
                              {step.date1 && (
                                <span className="text-sm text-gray-700 text-center whitespace-nowrap">
                                  {step.date1Label} {step.date1}
                                </span>
                              )}
                              {step.date2 && (
                                <span className="text-sm text-gray-700 text-center whitespace-nowrap">
                                  {step.date2Label} {step.date2}
                                </span>
                              )}
                            </div>
                          )}
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
          { label: "분야(EESD)", value: project.categoryName, icon: Folder, color: "blue" },
          { label: "영역", value: project.fieldName, icon: Folder, color: "violet" },
          {
            label: "매출",
            value: project.expectedAmount ? formatCurrency(project.expectedAmount, project.currency as any) : "-",
            icon: DollarSign,
            color: "emerald"
          },
          {
            label: "PM / 영업대표",
            value: `${project.managerName || "-"} / ${project.salesRepresentativeName || "-"}`,
            icon: Users,
            color: "indigo"
          },
          {
            label: "계약기간",
            value: (
              <div className="flex flex-col text-sm text-gray-900">
                <span>{formatDate(project.contractStartDate)}</span>
                <span>~ {formatDate(project.contractEndDate)}</span>
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
                project.riskLevel === "high" ? "text-red-600" :
                  project.riskLevel === "medium" ? "text-amber-600" :
                    project.riskLevel === "low" ? "text-emerald-600" : "text-gray-900"
              )}>
                {project.riskLevel === "high" ? "상" :
                  project.riskLevel === "medium" ? "중" :
                    project.riskLevel === "low" ? "하" : "-"}
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

      {/* 프로젝트 진단 AI 분석 섹션 */}
      <ProjectAiAnalysis projectId={id} projectData={project} />

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
