"use client";

import { useState, use, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
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
  const [status, setStatus] = useState("not_started");
  const [currency] = useState<Currency>("KRW");
  const [projectUnitPrices, setProjectUnitPrices] = useState<ProjectUnitPrice[]>([]);
  const [header, setHeader] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // 상태 관리
  const refreshStatus = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/profitability?projectId=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profitabilities && data.profitabilities.length > 0) {
          const currentHeader = data.profitabilities[0];
          setStatus(currentHeader.status || "not_started");
          setHeader(currentHeader);
        }
      }

      // 부가 수익/비용도 함께 로드
      try {
        const diffData = await ProfitabilityService.fetchProfitabilityDiff(parseInt(id));
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
  }, [id]);

  // 하위 탭들에서 공통으로 사용할 데이터 로드 (수지분석 연동용)
  const { items: manpowerPlanItems, loading: manpowerLoading, refresh: refreshManpower } = useManpowerPlan(project?.id, projectUnitPrices, project);
  const { expenses: standardExpenses, loading: expenseLoading, refresh: refreshStandardExpenses } = useStandardExpenses(project?.id || 0);
  const { items: productPlanItems, loading: productLoading, refresh: refreshProductPlan } = useProductPlan(project?.id);
  const { items: projectExpenseItems, loading: projectExpenseLoading, refresh: refreshProjectExpenses } = useProjectExpense(project?.id || 0, project, manpowerPlanItems, standardExpenses);

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
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("수지차 데이터가 저장되었습니다.");
        refreshStatus();
      } else {
        alert("수지차 저장에 실패했습니다.");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleComplete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    if (window.confirm("수지분석서 작성을 완료하시겠습니까? 완료 후에는 수정이 불가능합니다.")) {
      try {
        const res = await fetch(`/api/profitability/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: parseInt(id), status: "completed" }),
        });
        if (res.ok) {
          setStatus("completed");
          alert("수지분석서 작성이 완료되었습니다.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getStatusDisplay = (s: string) => {
    switch (s) {
      case "not_started": return { label: "미작성", color: "bg-gray-100 text-gray-700 border-gray-200" };
      case "in_progress": return { label: "작성중", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "completed": return { label: "작성완료", color: "bg-green-50 text-green-700 border-green-200" };
      default: return { label: s, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const handleExportToExcel = async () => {
    if (!project || !id) return;

    try {
      setIsExporting(true);
      await exportProfitabilityToExcel(
        parseInt(id),
        project.name,
        project.projectCode
      );
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Excel 파일 생성 중 오류가 발생했습니다.');
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
          <Link href={`/projects/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">수지분석서 - {project.name}</h1>
            <p className="text-sm text-gray-600">{project.customerName} | {project.projectCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshStatus}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm"
            title="상태 새로고침"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={isExporting ? "Excel 파일 생성 중..." : "Excel로 내보내기"}
          >
            <FileSpreadsheet className="h-4 w-4" />
            EXCEL
          </button>
          <div className={`rounded-md border px-3 py-2 text-sm font-medium ${getStatusDisplay(status).color}`}>상태: {getStatusDisplay(status).label}</div>
          {status !== "completed" && (
            <button
              type="button"
              onClick={handleComplete}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
            >
              <CheckCircle2 className="h-4 w-4" /> 작성 완료
            </button>
          )}
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
            isReadOnly={status === "completed"}
            onSave={refreshStatus}
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
            isReadOnly={status === "completed"}
            onSave={refreshStatus}
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
            isReadOnly={status === "completed"}
          />
        )}
        {activeTab === "product-plan" && (
          <ProductPlanTab
            projectId={project.id}
            status={status}
            currency={currency}
            onSave={handleSaveProductPlan}
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
          />
        )}
      </div>
    </div>
  );
}
