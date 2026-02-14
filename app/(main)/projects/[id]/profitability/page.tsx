"use client";

import { useState, use, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  RotateCw,
  Plus,
  Download,
} from "lucide-react";
import { Button, Badge, Dropdown, StatusBadge, useToast } from "@/components/ui";
import type { AlertType } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  calculateTotalRevenue,
  calculateTotalCost,
  calculateNetProfit,
  calculateProfitRate,
  calculateProfitabilitySummary
} from "@/lib/utils/calculations";
import { Currency } from "@/lib/utils/currency";

// 컴포넌트 임포트
import { SummaryTab } from "./components/SummaryTab";
import { ProductPlanTab } from "./components/ProductPlanTab";
import { ManpowerPlanTab } from "./components/ManpowerPlanTab";
import { ProfitabilityDiffTab } from "./components/ProfitabilityDiffTab";
import { StandardPriceTab } from "./components/StandardPriceTab";
import { StandardExpenseTab } from "./components/StandardExpenseTab";
import { ProjectExpenseTab } from "./components/ProjectExpenseTab";
import { OrderProposalTab } from "./components/OrderProposalTab";
import { useManpowerPlan } from "@/hooks/useManpowerPlan";
import { useStandardExpenses } from "@/hooks/useStandardExpenses";
import { useProductPlan } from "@/hooks/useProductPlan";
import { useProjectExpense } from "@/hooks/useProjectExpense";
import { ProjectUnitPrice, ManpowerPlanItem, StandardExpense } from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";
import { exportProfitabilityToExcel } from "@/lib/utils/excel-export";

// 프로젝트 인터페이스
interface Project {
  id: number;
  name: string;
  projectCode: string;
  customerName: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  currency: "KRW" | "USD" | "EUR" | "JPY";
  managerName?: string;
}

export default function ProfitabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [status, setStatus] = useState("STANDBY");
  const [currency] = useState<Currency>("KRW");
  // 버전 관리 상태
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>(undefined);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [projectUnitPrices, setProjectUnitPrices] = useState<ProjectUnitPrice[]>([]);
  const [header, setHeader] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    }
  };

  // 수지차 데이터 (부가 수익/비용) - 중앙 관리
  const [extraData, setExtraData] = useState({ extraRevenue: 0, extraExpense: 0 });

  // 수지차 데이터 상태
  const [formData, setFormData] = useState({
    softwareRevenue: 0,
    hardwareRevenue: 0,
    laborCost: 0,
    otherCost: 0,
  });

  // 프로젝트 정보 로드
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject({
            id: data.project.id,
            name: data.project.name,
            projectCode: data.project.project_code,
            customerName: data.project.customer_name || "미지정",
            contractStartDate: data.project.contract_start_date,
            contractEndDate: data.project.contract_end_date,
            currency: (data.project.currency || "KRW") as any,
            managerName: data.project.manager_name || "미지정",
          });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // 기준단가표 로드
  const loadUnitPrices = useCallback(async () => {
    if (!project) return;
    try {
      const year = project.contractStartDate
        ? new Date(project.contractStartDate).getFullYear()
        : 2025;
      const prices = await ProfitabilityService.fetchProjectUnitPrices(year);
      setProjectUnitPrices(prices);
    } catch (error) {
      console.error("Error loading unit prices:", error);
    }
  }, [project]);

  useEffect(() => {
    loadUnitPrices();
  }, [loadUnitPrices]);

  // 상태 및 버전 목록 관리
  const refreshStatus = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/profitability?projectId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.profitabilities || []);

        // 만약 선택된 버전이 없으면 최신 버전 선택
        if (data.profitabilities && data.profitabilities.length > 0) {
          const currentHeader = selectedVersionId
            ? data.profitabilities.find((v: any) => v.id === selectedVersionId) || data.profitabilities[0]
            : data.profitabilities[0];

          setStatus(currentHeader.status || "STANDBY");
          setHeader(currentHeader);
          if (!selectedVersionId) setSelectedVersionId(currentHeader.id);
        } else {
          // 데이터가 하나도 없으면 자동 생성 (버전 1)
          const newHeader = await ProfitabilityService.ensureHeader(parseInt(id), "초기 버전");
          if (newHeader) {
            setVersions([newHeader]);
            setSelectedVersionId(newHeader.id);
            setStatus(newHeader.status || "STANDBY");
            setHeader(newHeader);
          }
        }
      }

      // 부가 수익/비용도 함께 로드
      try {
        const diffData = await ProfitabilityService.fetchProfitabilityDiff(parseInt(id), selectedVersionId);
        setExtraData({
          extraRevenue: diffData.extraRevenue || 0,
          extraExpense: diffData.extraExpense || 0
        });
      } catch (e) {
        console.error("Error fetching extra data:", e);
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
  };

  useEffect(() => {
    if (id) refreshStatus();
  }, [id, selectedVersionId]);

  // 하위 탭들에서 공통으로 사용할 데이터 로드 (수지분석 연동용)
  const { items: manpowerPlanItems, loading: manpowerLoading, refresh: refreshManpower } = useManpowerPlan(project?.id, projectUnitPrices, project, selectedVersionId);
  const { expenses: standardExpenses, loading: expenseLoading, refresh: refreshStandardExpenses } = useStandardExpenses(project?.id || 0);
  const { items: productPlanItems, loading: productLoading, refresh: refreshProductPlan } = useProductPlan(project?.id, selectedVersionId);
  const { items: projectExpenseItems, loading: projectExpenseLoading, refresh: refreshProjectExpenses } = useProjectExpense(project?.id || 0, project, manpowerPlanItems, standardExpenses, selectedVersionId);

  // 저장 핸들러 정의
  const handleSaveManpower = () => {
    refreshStatus();
    refreshManpower();
  };

  const handleSaveStandardExpenses = () => {
    refreshStatus();
    refreshStandardExpenses();
  };

  const handleSaveProjectExpenses = () => {
    refreshStatus();
    refreshProjectExpenses();
  };

  const handleSaveProductPlan = () => {
    refreshStatus();
    refreshProductPlan();
  };

  const handleSaveOrderProposal = () => {
    refreshStatus();
  };

  const refreshAllData = useCallback(async () => {
    try {
      await refreshStatus();
      await refreshManpower();
      await refreshStandardExpenses();
      await refreshProductPlan();
      await refreshProjectExpenses();
    } catch (error) {
      console.error("Error refreshing all data:", error);
    }
  }, [refreshStatus, refreshManpower, refreshStandardExpenses, refreshProductPlan, refreshProjectExpenses]);




  // 공통 계산 로직 적용 (요약 탭 및 저장용)
  const summary = useMemo(() => {
    return calculateProfitabilitySummary(
      manpowerPlanItems,
      productPlanItems,
      projectExpenseItems,
      extraData.extraRevenue,
      extraData.extraExpense
    );
  }, [manpowerPlanItems, productPlanItems, projectExpenseItems, extraData]);

  const totalRevenue = summary.totalRevenue;
  const totalCost = summary.totalCost;
  const netProfit = summary.netProfit;
  const profitRate = summary.profitRate;
  const { ourMm, othersMm } = summary;

  // 저장 및 완료 정기
  const handleSaveProfitabilityDiff = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}/profitability-diff`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, profitabilityId: selectedVersionId }),
      });

      if (res.ok) {
        showAlert("수지차 데이터가 저장되었습니다.", "success");
        refreshStatus();
      } else {
        showAlert("수지차 저장에 실패했습니다.", "error");
      }
    } catch (error) {
      showAlert("오류가 발생했습니다.", "error");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    // 완료 상태로 변경 시 확인
    if (newStatus === 'COMPLETED') {
      showAlert(
        "수지분석서 작성을 완료하시겠습니까? 완료 후에는 수정이 불가능합니다.",
        "confirm",
        "작성 완료",
        async () => {
          await executeStatusChange(newStatus);
        }
      );
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/profitability/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: parseInt(id), status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        if (newStatus === 'COMPLETED') {
          showAlert("수지분석서 작성이 완료되었습니다.", "success");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        showAlert(`상태 변경 실패: ${errorData.message || '알 수 없는 오류'}`, "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("오류가 발생했습니다.", "error");
    }
  };

  const getStatusDisplay = (s: string) => {
    switch (s) {
      case "STANDBY": return { label: "대기", color: "bg-gray-100 text-gray-700 border-gray-200" };
      case "IN_PROGRESS": return { label: "작성중", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "COMPLETED": return { label: "작성완료", color: "bg-green-50 text-green-700 border-green-200" };
      default: return { label: s, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const handleCreateNewVersion = async () => {
    if (!id) return;
    const comment = window.prompt("새 버전에 대한 코멘트를 입력해주세요.");
    if (comment === null) return;

    try {
      setIsCreatingVersion(true);
      const res = await fetch("/api/profitability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: id, version_comment: comment }),
      });

      if (res.ok) {
        const data = await res.json();
        showAlert(`v${data.version} 버전이 생성되었습니다.`, "success");
        setSelectedVersionId(data.id);
        refreshStatus();
      } else {
        showAlert("새 버전 생성에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("Error creating version:", error);
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!project || !id || !selectedVersionId) return;

    try {
      setIsExporting(true);
      await exportProfitabilityToExcel(
        selectedVersionId,
        project.name,
        project.projectCode
      );
    } catch (error) {
      console.error('Excel export error:', error);
      showAlert('Excel 파일 생성 중 오류가 발생했습니다.', "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || (activeTab === "project-expense" && (manpowerLoading || expenseLoading)) || (activeTab === "profitability-diff" && (manpowerLoading || productLoading || projectExpenseLoading))) return <div className="flex items-center justify-center py-12 text-sm text-gray-500">로딩 중...</div>;
  if (!project) return <div className="flex items-center justify-center py-12 text-sm text-gray-500">프로젝트를 찾을 수 없습니다.</div>;

  const tabs = [
    { id: "summary", label: "요약" },
    { id: "order-proposal", label: "수주품의" },
    { id: "profitability-diff", label: "수지차" },
    { id: "product-plan", label: "제품 계획" },
    { id: "manpower-plan", label: "인력 계획" },
    { id: "project-expense", label: "프로젝트 경비" },
    { id: "standard-price", label: "기준-단가" },
    { id: "standard-expense", label: "기준-경비" },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}`} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-300">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                수지분석서 - {project.name}
              </h1>
              <StatusBadge
                status={status}
              />
            </div>
            <p className="text-sm text-gray-600">
              {project.projectCode} | {project.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">

          {/* Version Selection */}

          {/* Version Selection */}
          <div className="flex items-center gap-1">
            <Dropdown
              value={selectedVersionId?.toString() || ""}
              onChange={(val) => setSelectedVersionId(Number(val))}
              options={versions.map((v) => ({
                value: v.id.toString(),
                label: `VERSION ${v.version}`,
              }))}
              className="w-40 font-bold"
              variant="standard"
              align="center"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateNewVersion}
              disabled={isCreatingVersion || (versions.length > 0 && status !== 'COMPLETED' && status !== 'approved')}
              className="flex items-center gap-1 ml-1 px-3"
              title={
                versions.length > 0 && status !== 'COMPLETED' && status !== 'approved'
                  ? "현재 버전이 완료되어야 새 버전을 생성할 수 있습니다"
                  : "새 버전 생성"
              }
            >
              <Plus className="h-4 w-4" />
              V{versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1}
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-600/90 border-transparent hover:shadow-lg transition-all"
          >
            <Download className="h-4 w-4" />
            엑셀
          </Button>

          <Button
            variant="primary"
            onClick={async (e) => {
              // 1. 현재 탭 데이터 저장
              if (activeTab === 'manpower') handleSaveManpower();
              else if (activeTab === 'standard-expense') handleSaveStandardExpenses();
              else if (activeTab === 'project-expense') handleSaveProjectExpenses();
              else if (activeTab === 'product') handleSaveProductPlan();
              else if (activeTab === 'diff') await handleSaveProfitabilityDiff();
              else if (activeTab === 'order-proposal') handleSaveOrderProposal();

              // 2. 상태를 'COMPLETED'로 변경
              await handleStatusChange('COMPLETED');
            }}
            disabled={status === 'COMPLETED' || status === 'approved'}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            작성완료
          </Button>
        </div>
      </div>


      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {activeTab === "summary" && (
          <SummaryTab
            projectName={project.name}
            customerName={project.customerName}
            projectCode={project.projectCode}
            currency={currency}
            totalRevenue={totalRevenue}
            totalCost={totalCost}
            netProfit={netProfit}
            profitRate={profitRate}
            ourMm={ourMm}
            othersMm={othersMm}
          />
        )}
        {activeTab === "order-proposal" && (
          <OrderProposalTab
            project={project}
            manpowerItems={manpowerPlanItems}
            productItems={productPlanItems}
            expenseItems={projectExpenseItems}
            currency={currency}
            isReadOnly={status === "COMPLETED" || status === "approved" || status === "review"}
            onSave={refreshStatus}
            profitabilityId={selectedVersionId}
          />
        )}
        {activeTab === "profitability-diff" && (
          <ProfitabilityDiffTab
            projectId={project.id}
            currency={currency}
            manpowerItems={manpowerPlanItems}
            productItems={productPlanItems}
            expenseItems={projectExpenseItems}
            refreshAllData={refreshAllData}
            isReadOnly={status === "COMPLETED" || status === "approved" || status === "review"}
            onSave={refreshStatus}
            profitabilityId={selectedVersionId}
          />
        )}
        {activeTab === "standard-price" && (
          <StandardPriceTab
            projectId={project.id}
            unitPriceYear={project.contractStartDate ? new Date(project.contractStartDate).getFullYear() : 2025}
          />
        )}
        {activeTab === "standard-expense" && (
          <StandardExpenseTab
            projectId={project.id}
            onSave={handleSaveStandardExpenses}
            isReadOnly={status === "COMPLETED"}
          />
        )}
        {activeTab === "product-plan" && (
          <ProductPlanTab
            projectId={project.id}
            status={status}
            currency={currency}
            onSave={handleSaveProductPlan}
            profitabilityId={selectedVersionId}
          />
        )}
        {activeTab === "manpower-plan" && (
          <ManpowerPlanTab
            projectId={project.id}
            project={project as any}
            projectUnitPrices={projectUnitPrices}
            currency={currency}
            status={status}
            onSave={handleSaveManpower}
            profitabilityId={selectedVersionId}
          />
        )}
        {activeTab === "project-expense" && (
          <ProjectExpenseTab
            projectId={project.id}
            onSave={handleSaveProjectExpenses}
            project={project as any}
            manpowerPlanItems={manpowerPlanItems as ManpowerPlanItem[]}
            standardExpenses={standardExpenses as StandardExpense[]}
            currency={currency}
            status={status}
            profitabilityId={selectedVersionId}
          />
        )}
      </div>

    </div>
  );
}
