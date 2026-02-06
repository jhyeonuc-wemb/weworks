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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Currency } from "@/lib/utils/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { DatePicker } from "@/components/ui";
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

const workflowSteps = [
  {
    id: "sales",
    label: "영업/PS",
    path: "",
    icon: FileText,
  },
  {
    id: "md_estimation",
    label: "M/D 산정",
    path: "/md-estimation",
    icon: FileText,
  },
  {
    id: "vrb",
    label: "VRB",
    path: "/vrb-review",
    icon: CheckCircle2,
  },
  {
    id: "profitability",
    label: "수지분석서",
    path: "/profitability",
    icon: DollarSign,
  },
  {
    id: "in_progress",
    label: "프로젝트 진행",
    path: "",
    icon: Settings,
  },
  {
    id: "settlement",
    label: "수지정산서",
    path: "/settlement",
    icon: FileText,
  },
  {
    id: "warranty",
    label: "하자보증",
    path: "/warranty",
    icon: Shield,
  },
];

const phaseOrder: Record<string, number> = {
  sales: 0,
  md_estimation: 1,
  vrb: 2,
  profitability: 3,
  in_progress: 4,
  settlement: 5,
  warranty: 6,
};

const statusPhaseMap: Record<string, string> = {
  sales: "sales",
  md_estimation: "md_estimation",
  md_estimated: "vrb",
  vrb_review: "vrb",
  vrb_approved: "profitability",
  vrb_rejected: "profitability",
  team_allocation: "team_allocation",
  profitability_analysis: "profitability",
  profitability_completed: "profitability",
  profitability_review: "profitability",
  profitability_approved: "in_progress",
  profitability_rejected: "profitability",
  in_progress: "in_progress",
  on_hold: "in_progress",
  completed: "settlement",
  settlement: "settlement",
  settlement_completed: "settlement",
  settlement_review: "settlement",
  settlement_approved: "warranty",
  settlement_rejected: "settlement",
  warranty: "warranty",
  warranty_completed: "warranty",
  cancelled: "sales",
};

function getCurrentStepIndex(status: string, currentPhase: string): number {
  const phase = statusPhaseMap[status] || currentPhase || "sales";
  return phaseOrder[phase] || 0;
}

function getStepStatus(
  stepIndex: number,
  currentStepIndex: number,
  status: string,
  stepId?: string
): "completed" | "current" | "pending" | "rejected" {
  // VRB 단계에서 반려된 경우
  if (stepId === "vrb" && status === "vrb_rejected") {
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

function getNextAction(status: string, currentPhase: string, projectId: string) {
  const phase = statusPhaseMap[status] || currentPhase;

  switch (status) {
    case "sales":
    case "sales_opportunity":
      return {
        label: "M/D 산정",
        href: `/projects/${projectId}/md-estimation`,
        action: "md_estimation",
      };
    case "md_estimated":
      return {
        label: "VRB 작성",
        href: `/projects/${projectId}/vrb-review`,
        action: "vrb_review",
      };
    case "vrb_approved":
    case "vrb_rejected":
      return {
        label: "수지분석서 작성",
        href: `/projects/${projectId}/profitability`,
        action: "profitability_analysis",
      };
    case "profitability_completed":
      return {
        label: "수지분석서 승인 요청",
        href: `/projects/${projectId}/profitability/review`,
        action: "profitability_review",
      };
    case "profitability_approved":
      return {
        label: "프로젝트 시작",
        href: "#",
        action: "in_progress",
      };
    case "completed":
      return {
        label: "수지정산서 작성",
        href: `/projects/${projectId}/settlement`,
        action: "settlement",
      };
    case "settlement_completed":
      return {
        label: "수지정산서 승인 요청",
        href: `/projects/${projectId}/settlement/review`,
        action: "settlement_review",
      };
    case "settlement_approved":
      return {
        label: "하자보증 시작",
        href: `/projects/${projectId}/warranty`,
        action: "warranty",
      };
    default:
      return null;
  }
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
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectCode: "",
    name: "",
    category: "",
    customerId: "",
    ordererId: "",
    description: "",
    managerId: "",
    salesRepresentativeId: "",
    contractStartDate: "",
    contractEndDate: "",
    actualStartDate: "",
    actualEndDate: "",
    currency: "KRW" as Currency,
    expectedAmount: "",
    processStatus: "",
    riskLevel: "",
  });

  // 검색 및 드롭다운 상태
  const [pmSearch, setPmSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [ordererSearch, setOrdererSearch] = useState("");
  const [showPmDropdown, setShowPmDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showOrdererDropdown, setShowOrdererDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 편집 모달 열기
  const handleOpenEditModal = async () => {
    if (!project) return;

    setIsEditModalOpen(true);
    setModalLoading(true);

    try {
      // 사용자, 고객사, 카테고리 데이터 불러오기
      const [usersRes, clientsRes, categoriesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/clients"),
        fetch("/api/project-categories"),
      ]);

      let loadedUsers: User[] = [];
      let loadedClients: Client[] = [];
      let loadedCategories: ProjectCategory[] = [];

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        loadedUsers = usersData.users || [];
        setUsers(loadedUsers);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        loadedClients = clientsData.clients || [];
        setClients(loadedClients);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        loadedCategories = categoriesData.categories || [];
        setProjectCategories(loadedCategories);
      }

      // 프로젝트 데이터로 폼 초기화
      setFormData({
        projectCode: project.project_code || "",
        name: project.name || "",
        category: project.category_id?.toString() || "",
        customerId: project.customer_id?.toString() || "",
        ordererId: project.orderer_id?.toString() || "",
        description: project.description || "",
        managerId: project.manager_id?.toString() || "",
        salesRepresentativeId: project.sales_representative_id?.toString() || "",
        contractStartDate: project.contract_start_date ? project.contract_start_date.split('T')[0] : "",
        contractEndDate: project.contract_end_date ? project.contract_end_date.split('T')[0] : "",
        actualStartDate: project.actual_start_date ? project.actual_start_date.split('T')[0] : "",
        actualEndDate: project.actual_end_date ? project.actual_end_date.split('T')[0] : "",
        currency: (project.currency || "KRW") as Currency,
        expectedAmount: project.expected_amount?.toString() || "",
        processStatus: project.process_status || "",
        riskLevel: project.risk_level || "",
      });

      // 검색 필드 초기화 (데이터 로드 후)
      const selectedPm = loadedUsers.find((u: User) => u.id === project.manager_id);
      const selectedSales = loadedUsers.find((u: User) => u.id === project.sales_representative_id);
      const selectedCustomer = loadedClients.find((c: Client) => c.id === project.customer_id && c.type === "customer");
      const selectedOrderer = loadedClients.find((c: Client) => c.id === project.orderer_id && c.type === "orderer");

      setPmSearch(selectedPm?.name || "");
      setSalesSearch(selectedSales?.name || "");
      setCustomerSearch(selectedCustomer?.name || "");
      setOrdererSearch(selectedOrderer?.name || "");
    } catch (error) {
      console.error("Error loading edit data:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // 편집 저장
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          project_code: formData.projectCode || null,
          category_id: formData.category ? parseInt(formData.category) : null,
          customer_id: formData.customerId ? parseInt(formData.customerId) : null,
          orderer_id: formData.ordererId ? parseInt(formData.ordererId) : null,
          description: formData.description,
          contract_start_date: formData.contractStartDate || null,
          contract_end_date: formData.contractEndDate || null,
          actual_start_date: formData.actualStartDate || null,
          actual_end_date: formData.actualEndDate || null,
          expected_amount: formData.expectedAmount ? parseFloat(formData.expectedAmount) : null,
          currency: formData.currency,
          manager_id: formData.managerId ? parseInt(formData.managerId) : null,
          sales_representative_id: formData.salesRepresentativeId ? parseInt(formData.salesRepresentativeId) : null,
          process_status: formData.processStatus || null,
          current_phase: formData.processStatus || null, // 단계 정보도 함께 업데이트
          risk_level: formData.riskLevel || null,
        }),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm("정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
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
    } catch (error: any) {
      console.error("Error deleting project:", error);
      alert(`프로젝트 삭제 실패: ${error.message}`);
      setIsDeleting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePmSelect = (userId: string, userName: string) => {
    setFormData((prev) => ({ ...prev, managerId: userId }));
    setPmSearch(userName);
    setShowPmDropdown(false);
  };

  const handleSalesSelect = (userId: string, userName: string) => {
    setFormData((prev) => ({ ...prev, salesRepresentativeId: userId }));
    setSalesSearch(userName);
    setShowSalesDropdown(false);
  };

  const filteredPms = users.filter(
    (user) =>
      (user.role_name === "pm" || user.role_name === "admin") &&
      (user.name.toLowerCase().includes(pmSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(pmSearch.toLowerCase()))
  );

  const filteredSales = users.filter(
    (user) =>
      user.role_name === "sales" &&
      (user.name.toLowerCase().includes(salesSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  const selectedPm = users.find((u) => u.id.toString() === formData.managerId);
  const selectedSales = users.find(
    (u) => u.id.toString() === formData.salesRepresentativeId
  );
  const selectedCustomer = clients.find(
    (c) => c.id.toString() === formData.customerId
  );
  const selectedOrderer = clients.find(
    (c) => c.id.toString() === formData.ordererId
  );

  const filteredCustomers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredOrderers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(ordererSearch.toLowerCase())
  );

  const handleCustomerSelect = (clientId: string, clientName: string) => {
    setFormData((prev) => ({ ...prev, customerId: clientId }));
    setCustomerSearch(clientName);
    setShowCustomerDropdown(false);
  };

  const handleOrdererSelect = (clientId: string, clientName: string) => {
    setFormData((prev) => ({ ...prev, ordererId: clientId }));
    setOrdererSearch(clientName);
    setShowOrdererDropdown(false);
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

  const currentStepIndex = getCurrentStepIndex(project.status, project.current_phase || "");
  const nextAction = getNextAction(project.status, project.current_phase || "", id);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* 헤더 - Neo Detail Header */}
      <div className="relative group/header">
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-10 bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex items-center gap-6">
              <Link
                href="/projects"
                className="group/back flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 hover:shadow-xl transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft size={18} strokeWidth={3} className="group-hover/back:-translate-x-0.5 transition-transform" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {project.project_code && (
                    <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                      {project.project_code}
                    </span>
                  )}
                  <div className="h-1 w-1 rounded-full bg-slate-200 mx-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-80">
                    {project.customer_name || "-"}
                  </span>
                  {project.orderer_name && project.orderer_name !== project.customer_name && (
                    <>
                      <div className="h-1 w-1 rounded-full bg-slate-100 mx-1" />
                      <span className="text-[10px] font-black text-slate-300 italic opacity-80">
                        {project.orderer_name}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl italic leading-tight">
                  {project.name}
                </h1>
              </div>
            </div>
            {project.description && (
              <div className="pl-[70px]">
                <p className="text-xs font-bold text-slate-400 italic border-l-2 border-slate-100 pl-5 py-0.5 leading-relaxed max-w-2xl opacity-80">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 self-end md:self-center ml-auto">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 px-8 py-4 text-xs font-black text-slate-700 hover:bg-slate-50 hover:border-slate-200 hover:shadow-xl transition-all active:scale-95 shadow-sm group"
            >
              <Edit size={14} strokeWidth={3} className="text-slate-400 group-hover:text-slate-900" />
              <span>EDIT</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-3 rounded-xl bg-white border border-rose-50 px-8 py-4 text-xs font-black text-rose-500 hover:bg-rose-50/50 hover:border-rose-100 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95 shadow-sm group"
            >
              <Trash2 size={14} strokeWidth={3} />
              <span>DELETE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 워크플로우 단계 표시 - Neo Stepper */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-[3rem] blur-lg opacity-40" />
        <div className="relative rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl shadow-blue-50/50">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Project Status Hub</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Phase Workflow Management</p>
            </div>
            <div className="h-0.5 flex-1 bg-gray-50/50 mx-8" />
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black text-blue-700 uppercase">Live Tracking</span>
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const stepStatus = getStepStatus(index, currentStepIndex, project.status, step.id);
              const isLast = index === workflowSteps.length - 1;
              const isVrbStep = step.id === "vrb";
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

              return (
                <div key={step.id} className="flex-1 relative flex flex-col items-center group/step">
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
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-[1.25rem] transition-all duration-500 ring-4 shadow-lg group-hover/step:translate-y-[-2px]",
                      currentConfig.bg,
                      currentConfig.ring,
                      stepStatus === "current" && "shadow-xl shadow-blue-200 animate-pulse-slow"
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
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-[0.15em] transition-colors",
                        currentConfig.text
                      )}>
                        {step.label}
                      </span>
                      {stepStatus === "current" && (
                        <span className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest animate-pulse">Running...</span>
                      )}
                    </div>
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
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Phase Protocol</span>
              <h3 className="text-sm font-black text-gray-900 italic">시스템 권장 다음 작업 단계</h3>
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
          { label: "Category", value: project.category_name, icon: Folder, color: "blue" },
          { label: "Project Manager", value: project.manager_name, icon: Users, color: "indigo" },
          { label: "Sales Rep", value: project.sales_representative_name, icon: Users, color: "violet" },
          {
            label: "Contract Period",
            value: (
              <div className="flex flex-col font-mono text-sm">
                <span>{formatDate(project.contract_start_date)}</span>
                <span className="text-[10px] text-gray-300 italic">~ {formatDate(project.contract_end_date)}</span>
              </div>
            ),
            icon: Calendar, color: "emerald"
          },
          { label: "Team Size", value: "0명", icon: Users, color: "sky" },
          {
            label: "Risk Factor",
            value: (
              <span className={cn(
                "font-black uppercase tracking-widest",
                project.risk_level === "high" ? "text-red-600" :
                  project.risk_level === "medium" ? "text-amber-600" :
                    project.risk_level === "low" ? "text-emerald-600" : "text-gray-900"
              )}>
                {project.risk_level === "high" ? "Critical" :
                  project.risk_level === "medium" ? "Moderate" :
                    project.risk_level === "low" ? "Safe" : "-"}
              </span>
            ),
            icon: Shield, color: "rose"
          },
          { label: "Current Logic", value: workflowSteps[currentStepIndex]?.label || "Operational", icon: Settings, color: "blue" },
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
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{info.label}</span>
              </div>
              <div className="text-[15px] font-black text-gray-900 leading-tight">
                {info.value || "-"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href={`/projects/${id}`}
            className="border-b-2 border-gray-900 py-4 text-sm font-medium text-gray-900"
          >
            개요
          </Link>
          <Link
            href={`/projects/${id}/md-estimation`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            M/D 산정
          </Link>
          <Link
            href={`/projects/${id}/vrb-review`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            VRB
          </Link>
          <Link
            href={`/projects/${id}/profitability`}
            className={`border-b-2 py-4 text-sm font-medium ${false // 현재 탭 체크 필요
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
          >
            수지분석서
          </Link>
          <Link
            href={`/projects/${id}/team-allocation`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            인력 배치
          </Link>
          <Link
            href={`/projects/${id}/delivery`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            Delivery
          </Link>
          <Link
            href={`/projects/${id}/settlement`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            수지정산서
          </Link>
          <Link
            href={`/projects/${id}/warranty`}
            className="border-b-2 border-transparent py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            하자보증
          </Link>
        </nav>
      </div>

      {/* 개요 탭 컨텐츠 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">프로젝트 개요</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">프로젝트 코드</label>
              <p className="text-sm text-gray-900">{project.project_code || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">프로젝트명</label>
              <p className="text-sm text-gray-900">{project.name || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">고객사</label>
              <p className="text-sm text-gray-900">{project.customer_name || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">발주처</label>
              <p className="text-sm text-gray-900">
                {project.orderer_name || project.customer_name || "-"}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">PM</label>
              <p className="text-sm text-gray-900">{project.manager_name || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">영업대표</label>
              <p className="text-sm text-gray-900">{project.sales_representative_name || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">계약 기간</label>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  시작: {formatDate(project.contract_start_date)}
                </p>
                <p className="text-sm text-gray-900">
                  종료: {formatDate(project.contract_end_date)}
                </p>
              </div>
            </div>
            {(project.actual_start_date || project.actual_end_date) && (
              <div className="flex items-start gap-4">
                <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">실제 구축기간</label>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">
                    시작: {formatDate(project.actual_start_date)}
                  </p>
                  <p className="text-sm text-gray-900">
                    종료: {formatDate(project.actual_end_date)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 flex-nowrap min-w-0">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0 whitespace-nowrap">프로젝트 카테고리</label>
              <p className="text-sm font-semibold text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1">{project.category_name || "-"}</p>
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">위험도</label>
              <p className={`text-sm font-semibold ${project.risk_level === "high" ? "text-red-600" :
                project.risk_level === "medium" ? "text-yellow-600" :
                  project.risk_level === "low" ? "text-green-600" : "text-gray-900"
                }`}>
                {project.risk_level === "high" ? "상" :
                  project.risk_level === "medium" ? "중" :
                    project.risk_level === "low" ? "하" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsEditModalOpen(false)}
            />

            {/* 모달 */}
            <div className="relative z-10 w-full max-w-4xl rounded-lg border border-gray-200 bg-white shadow-xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">프로젝트 편집</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
                {modalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-gray-500">로딩 중...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveEdit} className="space-y-6">
                    <div className="space-y-6">
                      {/* 프로젝트 코드 */}
                      <div>
                        <label
                          htmlFor="edit-projectCode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          프로젝트 코드
                        </label>
                        <input
                          type="text"
                          id="edit-projectCode"
                          name="projectCode"
                          value={formData.projectCode}
                          onChange={handleChange}
                          placeholder="계약 완료 후 생성됩니다 (예: P24-039, P25-019)"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>

                      {/* 프로젝트명 */}
                      <div>
                        <label
                          htmlFor="edit-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          프로젝트명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="프로젝트명을 입력하세요"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>

                      {/* 프로젝트 카테고리 */}
                      <div>
                        <label
                          htmlFor="edit-category"
                          className="block text-sm font-medium text-gray-700"
                        >
                          프로젝트 카테고리
                        </label>
                        <select
                          id="edit-category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="">카테고리를 선택하세요</option>
                          {projectCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 고객사 선택 */}
                      <div className="relative">
                        <label
                          htmlFor="edit-customerId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          고객사
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            id="edit-customerId"
                            value={customerSearch || selectedCustomer?.name || ""}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              setShowCustomerDropdown(true);
                              if (!e.target.value) {
                                setFormData((prev) => ({ ...prev, customerId: "" }));
                              }
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                            placeholder="고객사명 또는 코드로 검색..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {showCustomerDropdown && filteredCustomers.length > 0 && (
                            <>
                              <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowCustomerDropdown(false)}
                              />
                              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {filteredCustomers.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() =>
                                      handleCustomerSelect(client.id.toString(), client.name)
                                    }
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {client.name}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 발주처 선택 */}
                      <div className="relative">
                        <label
                          htmlFor="edit-ordererId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          발주처
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            id="edit-ordererId"
                            value={ordererSearch || selectedOrderer?.name || ""}
                            onChange={(e) => {
                              setOrdererSearch(e.target.value);
                              setShowOrdererDropdown(true);
                              if (!e.target.value) {
                                setFormData((prev) => ({ ...prev, ordererId: "" }));
                              }
                            }}
                            onFocus={() => setShowOrdererDropdown(true)}
                            placeholder="발주처명 또는 코드로 검색..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {showOrdererDropdown && filteredOrderers.length > 0 && (
                            <>
                              <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowOrdererDropdown(false)}
                              />
                              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {filteredOrderers.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() =>
                                      handleOrdererSelect(client.id.toString(), client.name)
                                    }
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {client.name}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 설명 */}
                      <div>
                        <label
                          htmlFor="edit-description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          설명
                        </label>
                        <textarea
                          id="edit-description"
                          name="description"
                          rows={4}
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="프로젝트 설명을 입력하세요"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>

                      {/* PM 선택 */}
                      <div className="relative">
                        <label
                          htmlFor="edit-managerId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          프로젝트 매니저
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            id="edit-managerId"
                            value={pmSearch || selectedPm?.name || ""}
                            onChange={(e) => {
                              setPmSearch(e.target.value);
                              setShowPmDropdown(true);
                              if (!e.target.value) {
                                setFormData((prev) => ({ ...prev, managerId: "" }));
                              }
                            }}
                            onFocus={() => setShowPmDropdown(true)}
                            placeholder="PM 이름 또는 이메일로 검색..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {showPmDropdown && filteredPms.length > 0 && (
                            <>
                              <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowPmDropdown(false)}
                              />
                              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {filteredPms.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handlePmSelect(user.id.toString(), user.name)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 영업대표 선택 */}
                      <div className="relative">
                        <label
                          htmlFor="edit-salesRepresentativeId"
                          className="block text-sm font-medium text-gray-700"
                        >
                          영업대표
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            id="edit-salesRepresentativeId"
                            value={salesSearch || selectedSales?.name || ""}
                            onChange={(e) => {
                              setSalesSearch(e.target.value);
                              setShowSalesDropdown(true);
                              if (!e.target.value) {
                                setFormData((prev) => ({
                                  ...prev,
                                  salesRepresentativeId: "",
                                }));
                              }
                            }}
                            onFocus={() => setShowSalesDropdown(true)}
                            placeholder="영업대표 이름 또는 이메일로 검색..."
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {showSalesDropdown && filteredSales.length > 0 && (
                            <>
                              <div
                                className="fixed inset-0 z-0"
                                onClick={() => setShowSalesDropdown(false)}
                              />
                              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {filteredSales.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() =>
                                      handleSalesSelect(user.id.toString(), user.name)
                                    }
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 통화 및 예상 금액 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            통화
                          </label>
                          <div className="mt-1">
                            <CurrencySelector
                              value={formData.currency}
                              onChange={(currency) =>
                                setFormData({ ...formData, currency })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="edit-expectedAmount"
                            className="block text-sm font-medium text-gray-700"
                          >
                            예상 금액
                          </label>
                          <input
                            type="text"
                            id="edit-expectedAmount"
                            name="expectedAmount"
                            value={formData.expectedAmount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, "");
                              setFormData({ ...formData, expectedAmount: value });
                            }}
                            placeholder="예상 금액을 입력하세요"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {formData.expectedAmount && (
                            <p className="mt-1 text-xs text-gray-500">
                              {parseInt(formData.expectedAmount || "0").toLocaleString()}원
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 계약 기간 */}
                      <div className="grid grid-cols-2 gap-4">
                        <DatePicker
                          label="계약 시작일"
                          date={formData.contractStartDate ? new Date(formData.contractStartDate) : undefined}
                          setDate={(date) => setFormData(prev => ({ ...prev, contractStartDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                        />
                        <DatePicker
                          label="계약 종료일"
                          date={formData.contractEndDate ? new Date(formData.contractEndDate) : undefined}
                          setDate={(date) => setFormData(prev => ({ ...prev, contractEndDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                        />
                      </div>

                      {/* 실제 기간 */}
                      <div className="grid grid-cols-2 gap-4">
                        <DatePicker
                          label="실제 시작일"
                          date={formData.actualStartDate ? new Date(formData.actualStartDate) : undefined}
                          setDate={(date) => setFormData(prev => ({ ...prev, actualStartDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                        />
                        <DatePicker
                          label="실제 종료일"
                          date={formData.actualEndDate ? new Date(formData.actualEndDate) : undefined}
                          setDate={(date) => setFormData(prev => ({ ...prev, actualEndDate: date ? format(date, "yyyy-MM-dd") : "" }))}
                        />
                      </div>

                      {/* 단계 및 위험도 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="edit-processStatus"
                            className="block text-sm font-medium text-gray-700"
                          >
                            단계
                          </label>
                          <select
                            id="edit-processStatus"
                            name="processStatus"
                            value={formData.processStatus}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          >
                            <option value="">선택하세요</option>
                            <option value="sales">영업/PS</option>
                            <option value="md_estimation">M/D 산정</option>
                            <option value="vrb">VRB</option>
                            <option value="confirmation">컨펌</option>
                            <option value="team_allocation">인력 배치</option>
                            <option value="profitability">수지분석서</option>
                            <option value="in_progress">프로젝트 진행</option>
                            <option value="settlement">수지정산서</option>
                            <option value="warranty">하자보증</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="edit-riskLevel"
                            className="block text-sm font-medium text-gray-700"
                          >
                            위험도
                          </label>
                          <select
                            id="edit-riskLevel"
                            name="riskLevel"
                            value={formData.riskLevel}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          >
                            <option value="">선택하세요</option>
                            <option value="high">상</option>
                            <option value="medium">중</option>
                            <option value="low">하</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
