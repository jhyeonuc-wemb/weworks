"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Download, Plus, Trash2, CheckCircle2, Calendar as CalendarIcon, BarChart3, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { DatePicker, StatusBadge, Button, useToast } from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import type { AlertType } from "@/components/ui";
import {
  mapRankToJobLevel,
  getDefaultGradeByRank,
  determineAffiliationGroup,
} from '@/lib/utils/rank-mapping';
import type { ProjectUnitPrice } from "@/types/profitability";
import { useProjectPhase } from "@/hooks/useProjectPhase";

interface SettlementData {
  id?: number;
  project_id: number;
  profitability_id: number | null;
  settlement_date: string;
  approved_date?: string;

  // 계획
  planned_revenue: number;
  planned_cost: number;
  planned_labor_cost: number;
  planned_other_cost: number;
  planned_profit: number;
  planned_profit_rate: number;

  // 실적 (Actuals)
  actual_revenue: number;
  actual_cost: number;
  actual_labor_cost: number;
  actual_other_cost: number;

  // 실적 - 상세 Items
  actual_prod_rev_own?: number;
  actual_prod_rev_ext?: number;
  actual_svc_rev_own?: number;
  actual_svc_rev_ext?: number;
  actual_prod_cost_own?: number;
  actual_prod_cost_ext?: number;
  actual_svc_cost_own?: number;
  actual_svc_cost_ext?: number;
  actual_svc_mm_own?: number;
  actual_svc_mm_ext?: number;
  actual_expense_general?: number;
  actual_expense_special?: number;
  actual_biz_cost_indirect: number;
  actual_extra_revenue: number;
  actual_extra_cost: number;

  planned_svc_mm_own?: number;
  planned_svc_mm_ext?: number;
  notes: string;
  status: string;
}

interface LaborItem {
  id?: number;
  user_id: number | null;
  user_name: string;
  role: string;
  affiliation_group?: string;
  planned_mm: number;
  planned_cost: number;
  actual_mm: number;
  actual_cost: number;
}

interface ProductPlanItem {
  id?: number;
  type: string;
  productId?: number | null;
  productPlanId?: number | null;
  companyName: string;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
  basePrice: number;
  proposalPrice: number | null;
  discountRate: number;
  costPrice: number | null;
  requestDate: string;
  requestType: string;
  actualProposalPrice?: number | null;
  actualCostPrice?: number | null;
}


interface ManpowerPlanItem {
  id?: number;
  projectName: string;
  role: string;
  detailedTask: string;
  companyName: string;
  affiliationGroup: string;
  wmbRank: string;
  grade: string;
  name: string;
  userId: string | number | null;
  monthlyAllocation: { [key: string]: number };
  proposedUnitPrice: number | null;
  proposedAmount: number | null;
  internalUnitPrice: number | null;
  internalAmount: number | null;
  actualInternalAmount?: number | null;
  actualMonthlyAllocation?: { [key: string]: number | string };
  monthlyAmountAllocation?: { [key: string]: number | string };
  actualMonthlyAmountAllocation?: { [key: string]: number | string };
  isNew?: boolean;
}

interface ExtCompanyPlan {
  id: number;
  companyName: string;
  role1: string;
  role2: string;
  planMM: { [key: string]: string };
  planAmt: { [key: string]: string };
  execMM: { [key: string]: string };
  execAmt: { [key: string]: string };
}

interface ExpenseDetail {
  item: string;
  planStandard: number;
  planLatest: number;
  execTotal: number;
  sellAdmin: number;
  cost: number;
}

interface User {
  id: number;
  name: string;
  rankName: string;
  departmentName: string;
  grade: string | null;
}

interface SummaryData {
  prodRevOwn: number;
  prodRevExt: number;
  svcRevOwn: number;
  svcRevExt: number;
  total_revenue: number;
  prodCostOwn: number;
  prodCostExt: number;
  svcCostOwn: number;
  svcCostExt: number;
  expense_cost: number;
  internalMM: number;
  externalMM: number;
  profit: number;
  profit_rate: number;
}

export default function ProjectSettlementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  // ✅ 중앙집중 단계/상태 관리 훅 (단일 소스: we_project_phase_progress)
  // isInitialStatus: 아직 시작 안 한 상태 (구 STANDBY 역할)
  // isFinalStatus: 완료된 상태 (구 COMPLETED 역할)
  const { status: phaseStatus, isInitialStatus, isFinalStatus, finalStatus, onSaveSuccess, onCompleteSuccess } = useProjectPhase(
    isNaN(projectId) ? undefined : projectId,
    'settlement'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState({ general: 0, special: 0 });

  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [managerName, setManagerName] = useState("");
  const [managerPosition, setManagerPosition] = useState("");
  const [salesPersonName, setSalesPersonName] = useState("");
  const [salesPersonPosition, setSalesPersonPosition] = useState("");
  const [firstProfitabilityId, setFirstProfitabilityId] = useState<number | null>(null);
  const [latestProfitabilityId, setLatestProfitabilityId] = useState<number | null>(null);
  const [firstProfitabilityApprovedDate, setFirstProfitabilityApprovedDate] = useState("");
  const [latestProfitabilityApprovedDate, setLatestProfitabilityApprovedDate] = useState("");

  const [basePlanSummary, setBasePlanSummary] = useState<SummaryData | null>(null);
  const [latestPlanSummary, setLatestPlanSummary] = useState<SummaryData | null>(null);
  const [baseProductPlan, setBaseProductPlan] = useState<ProductPlanItem[]>([]);
  const [latestProductPlan, setLatestProductPlan] = useState<ProductPlanItem[]>([]);
  const [baseManpowerPlan, setBaseManpowerPlan] = useState<ManpowerPlanItem[]>([]);
  const [latestManpowerPlan, setLatestManpowerPlan] = useState<ManpowerPlanItem[]>([]);
  const [projectUnitPrices, setProjectUnitPrices] = useState<ProjectUnitPrice[]>([]);
  const [monthColumns, setMonthColumns] = useState<string[]>([]);
  const [initialMonthCount, setInitialMonthCount] = useState<number>(0);
  const [extCompanyPlans, setExtCompanyPlans] = useState<ExtCompanyPlan[]>([]);
  const [standardExpenseTotal, setStandardExpenseTotal] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [settlement, setSettlement] = useState<SettlementData>({
    project_id: projectId,
    profitability_id: null,
    settlement_date: new Date().toISOString().split('T')[0],
    approved_date: "",
    planned_revenue: 0,
    planned_cost: 0,
    planned_labor_cost: 0,
    planned_other_cost: 0,
    planned_profit: 0,
    planned_profit_rate: 0,
    actual_revenue: 0,
    actual_cost: 0,
    actual_labor_cost: 0,
    actual_other_cost: 0,
    actual_biz_cost_indirect: 0,
    actual_extra_revenue: 0,
    actual_extra_cost: 0,
    planned_svc_mm_own: 0,
    planned_svc_mm_ext: 0,
    notes: "",
    status: "STANDBY",
  });

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

  const [laborItems, setLaborItems] = useState<LaborItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const EXPENSE_ITEMS = [
    "직원식대", "프로젝트 부서비", "회식대",
    "여비교통비", "국내출장_교통비", "국내출장_식대", "국내출장_숙박", "국내출장비지원", "국내출장_주유대",
    "야근교통비", "통신비", "세금과공과", "회의비", "수도광열비", "임차료", "소모품비",
    "지급수수료", "지급수수료(보험)", "도서인쇄비", "운반비", "기타"
  ];

  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>(
    EXPENSE_ITEMS.map(item => ({
      item,
      planStandard: 0,
      planLatest: 0,
      execTotal: 0,
      sellAdmin: 0,
      cost: 0
    }))
  );

  useEffect(() => {
    if (!isNaN(projectId)) {
      fetchData();
    }
  }, [projectId]);

  // Effect to calculate totals from manual details
  useEffect(() => {
    const rev = Number(settlement.actual_prod_rev_own || 0) +
      Number(settlement.actual_prod_rev_ext || 0) +
      Number(settlement.actual_svc_rev_own || 0) +
      Number(settlement.actual_svc_rev_ext || 0);

    const l_cost = Number(settlement.actual_svc_cost_own || 0) +
      Number(settlement.actual_svc_cost_ext || 0);

    const o_cost = Number(settlement.actual_expense_general || 0) +
      Number(settlement.actual_expense_special || 0);

    const total_cost = Number(settlement.actual_prod_cost_own || 0) +
      Number(settlement.actual_prod_cost_ext || 0) +
      l_cost + o_cost;

    if (
      rev !== settlement.actual_revenue ||
      total_cost !== settlement.actual_cost ||
      l_cost !== settlement.actual_labor_cost ||
      o_cost !== settlement.actual_other_cost
    ) {
      setSettlement(prev => ({
        ...prev,
        actual_revenue: rev,
        actual_cost: total_cost,
        actual_labor_cost: l_cost,
        actual_other_cost: o_cost
      }));
    }
  }, [
    settlement.actual_prod_rev_own, settlement.actual_prod_rev_ext,
    settlement.actual_svc_rev_own, settlement.actual_svc_rev_ext,
    settlement.actual_prod_cost_own, settlement.actual_prod_cost_ext,
    settlement.actual_svc_cost_own, settlement.actual_svc_cost_ext,
    settlement.actual_expense_general, settlement.actual_expense_special,
    settlement.actual_revenue, settlement.actual_cost, settlement.actual_labor_cost, settlement.actual_other_cost
  ]);

  // Sync expenseDetails to settlement actuals
  // ※ expenseDetails 합산이 모두 0이면 settlement 값을 덮어쓰지 않음
  //    → (3) 수주차에서 직접 입력한 actual_expense_general/special 값 보존
  useEffect(() => {
    const totalSellAdmin = expenseDetails.reduce((sum, item) => sum + (item.sellAdmin || 0), 0);
    const totalCost = expenseDetails.reduce((sum, item) => sum + (item.cost || 0), 0);

    // Section 5에서 실제 입력된 값이 있는 경우에만 settlement에 반영
    if (totalSellAdmin === 0 && totalCost === 0) return;

    if (settlement.actual_expense_general !== totalSellAdmin || settlement.actual_expense_special !== totalCost) {
      setSettlement(prev => ({
        ...prev,
        actual_expense_general: totalSellAdmin,
        actual_expense_special: totalCost
      }));
    }
  }, [expenseDetails]);

  // 부가수익 데이터 (계획)
  const [extraData, setExtraData] = useState({
    baseExtraRevenue: 0,
    baseExtraExpense: 0,
    latestExtraRevenue: 0,
    latestExtraExpense: 0,
    baseBizCostIndirect: 0,
    latestBizCostIndirect: 0,
    baseProdCostOwn: 0,
    latestProdCostOwn: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // 사용자 목록 가져오기
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const userData = await usersRes.json();
        const fetchedUsers = (userData.users || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          rankName: u.rank_name,
          departmentName: u.department_name,
          grade: u.grade,
        }));
        setUsers(fetchedUsers);
        setUsers(fetchedUsers);
      }

      // 내 정보 로드
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      // 기준 단가 조회
      const currentYear = new Date().getFullYear();
      const unitPriceRes = await fetch(`/api/unit-prices?year=${currentYear}&isActive=true`);
      if (unitPriceRes.ok) {
        const unitPriceData = await unitPriceRes.json();
        const prices = (unitPriceData.unitPrices || []).map((p: any) => ({
          id: Number(p.id),
          affiliationGroup: p.affiliation_group || p.affiliationGroup,
          jobGroup: p.job_group || p.jobGroup,
          jobLevel: p.job_level || p.jobLevel,
          grade: p.grade,
          year: p.year,
          proposedStandard: p.proposed_standard,
          proposedApplied: p.proposed_applied,
          internalApplied: p.internal_applied || p.internalApplied,
        }));
        setProjectUnitPrices(prices);
      }

      // 프로젝트 정보 조회
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        const project = projectData.project;
        setProjectName(project.name || "");
        setProjectCode(project.projectCode || "");
        setCustomerName(project.customerName || "");
        setContractStartDate(project.actualStartDate ? project.actualStartDate.split('T')[0] : (project.contractStartDate ? project.contractStartDate.split('T')[0] : ""));
        setContractEndDate(project.actualEndDate ? project.actualEndDate.split('T')[0] : (project.contractEndDate ? project.contractEndDate.split('T')[0] : ""));
        setManagerName(project.managerName || "");
        setSalesPersonName(project.salesRepresentativeName || "");

        // 담당자 정보 조회 (직급 포함)
        if (project.managerId) {
          const managerRes = await fetch(`/api/users/${project.managerId}`);
          if (managerRes.ok) {
            const managerData = await managerRes.json();
            setManagerPosition(managerData.user?.rank_name || managerData.user?.position || "");
          }
        }

        if (project.salesRepresentativeId) {
          const salesRes = await fetch(`/api/users/${project.salesRepresentativeId}`);
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            setSalesPersonPosition(salesData.user?.rank_name || salesData.user?.position || "");
          }
        }
      }

      // 수지분석서 버전 조회 (최초/최종)
      const profitabilityListRes = await fetch(`/api/profitability?projectId=${projectId}`);
      if (profitabilityListRes.ok) {
        const profData = await profitabilityListRes.json();
        if (profData.profitabilities && profData.profitabilities.length > 0) {
          // 생성일자 및 ID 기준 정렬
          const sorted = [...profData.profitabilities].sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.id - b.id;
          });

          const first = sorted[0];
          const latest = sorted[sorted.length - 1];

          setFirstProfitabilityId(first.id);
          setLatestProfitabilityId(latest.id);

          setFirstProfitabilityApprovedDate(first.approved_date || first.written_date || (first.created_at ? first.created_at.split('T')[0] : ""));
          setLatestProfitabilityApprovedDate(latest.approved_date || latest.written_date || (latest.created_at ? latest.created_at.split('T')[0] : ""));

          const latestRev = Number(latest.total_revenue || latest.revenue || 0);
          setTotalRevenue(latestRev);

          setBasePlanSummary({
            prodRevOwn: Number(first.product_revenue_own || first.product_revenue || 0),
            prodRevExt: Number(first.product_revenue_ext || 0),
            svcRevOwn: Number(first.service_revenue_own || first.service_revenue || 0),
            svcRevExt: Number(first.service_revenue_ext || 0),
            total_revenue: Number(first.total_revenue || first.revenue || 0),
            prodCostOwn: Number(first.product_cost_own || first.purchase_cost || 0),
            prodCostExt: Number(first.product_cost_ext || 0),
            svcCostOwn: Number(first.service_cost_own || first.internal_labor_cost || 0),
            svcCostExt: Number(first.service_cost_ext || first.external_labor_cost || 0),
            expense_cost: Number(first.expense_cost || 0),
            internalMM: Number(first.internal_mm || 0),
            externalMM: Number(first.external_mm || 0),
            profit: Number(first.net_profit || first.profit || 0),
            profit_rate: Number(first.profit_rate || 0),
          });

          setLatestPlanSummary({
            prodRevOwn: Number(latest.product_revenue_own || latest.product_revenue || 0),
            prodRevExt: Number(latest.product_revenue_ext || 0),
            svcRevOwn: Number(latest.service_revenue_own || latest.service_revenue || 0),
            svcRevExt: Number(latest.service_revenue_ext || 0),
            total_revenue: latestRev,
            prodCostOwn: Number(latest.product_cost_own || latest.purchase_cost || 0),
            prodCostExt: Number(latest.product_cost_ext || 0),
            svcCostOwn: Number(latest.service_cost_own || latest.internal_labor_cost || 0),
            svcCostExt: Number(latest.service_cost_ext || latest.external_labor_cost || 0),
            expense_cost: Number(latest.expense_cost || 0),
            internalMM: Number(latest.internal_mm || 0),
            externalMM: Number(latest.external_mm || 0),
            profit: Number(latest.net_profit || latest.profit || 0),
            profit_rate: Number(latest.profit_rate || 0),
          });

          // 제품계획 데이터 가져오기 (최초 버전)
          if (first.id) {
            const firstProductRes = await fetch(`/api/projects/${projectId}/product-plan?profitabilityId=${first.id}`);
            if (firstProductRes.ok) {
              const firstProductData = await firstProductRes.json();
              setBaseProductPlan(firstProductData.items || []);
            }
          }

          // 제품계획 데이터 가져오기 (최종 버전)
          if (latest.id && latest.id !== first.id) {
            const latestProductRes = await fetch(`/api/projects/${projectId}/product-plan?profitabilityId=${latest.id}`);
            if (latestProductRes.ok) {
              const latestProductData = await latestProductRes.json();
              setLatestProductPlan(latestProductData.items || []);
            }
          } else if (latest.id === first.id) {
            // 최초와 최종이 같으면 동일 데이터 사용
            setLatestProductPlan(baseProductPlan);
          }

          // 인력계획 데이터 가져오기 (최초 버전)
          if (first.id) {
            const firstManpowerRes = await fetch(`/api/projects/${projectId}/manpower-plan`);
            if (firstManpowerRes.ok) {
              const firstManpowerData = await firstManpowerRes.json();
              setBaseManpowerPlan(firstManpowerData.items || []);

              // 월 컬럼 생성
              if (firstManpowerData.analysisStartMonth && firstManpowerData.analysisEndMonth) {
                const months: string[] = [];
                const start = new Date(firstManpowerData.analysisStartMonth + '-01');
                const end = new Date(firstManpowerData.analysisEndMonth + '-01');

                const current = new Date(start);
                while (current <= end) {
                  const year = current.getFullYear();
                  const month = current.getMonth() + 1;
                  months.push(`${year}-${String(month).padStart(2, '0')}`);
                  current.setMonth(current.getMonth() + 1);
                }
                setMonthColumns(months);
                setInitialMonthCount(months.length);
              }
            }
          }

          // 인력계획 데이터 가져오기 (최종 버전)
          if (latest.id && latest.id !== first.id) {
            const latestManpowerRes = await fetch(`/api/projects/${projectId}/manpower-plan`);
            if (latestManpowerRes.ok) {
              const latestManpowerData = await latestManpowerRes.json();
              setLatestManpowerPlan(latestManpowerData.items || []);
            }
          } else if (latest.id === first.id) {
            setLatestManpowerPlan(baseManpowerPlan);
          }

          // 수지차 데이터 (부가수익/비용) 가져오기
          try {
            const [baseDiffRes, latestDiffRes] = await Promise.all([
              fetch(`/api/projects/${projectId}/profitability-diff?profitabilityId=${first.id}`),
              fetch(`/api/projects/${projectId}/profitability-diff?profitabilityId=${latest.id}`)
            ]);

            if (baseDiffRes.ok && latestDiffRes.ok) {
              const baseDiff = await baseDiffRes.json();
              const latestDiff = await latestDiffRes.json();

              setExtraData({
                baseExtraRevenue: baseDiff.extraRevenue || 0,
                baseExtraExpense: baseDiff.extraExpense || 0,
                latestExtraRevenue: latestDiff.extraRevenue || 0,
                latestExtraExpense: latestDiff.extraExpense || 0,
                baseBizCostIndirect: baseDiff.bizCostIndirect || 0,
                latestBizCostIndirect: latestDiff.bizCostIndirect || 0,
                baseProdCostOwn: baseDiff.prodCostOwn || 0,
                latestProdCostOwn: latestDiff.prodCostOwn || 0,
              });
            }
          } catch (e) {
            console.error("Error fetching profitability diff data:", e);
          }
        }
      }

      // 정산서 조회 (있으면)
      const [settlementRes, phaseRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/settlement`),
        fetch(`/api/projects/${projectId}/phase-status`),  // 단일 소스
      ]);

      // phase-status API에서 settlement 상태 로드 (단일 소스)
      let settlementPhaseStatus = 'STANDBY';
      if (phaseRes.ok) {
        const phaseData = await phaseRes.json();
        const settlementPhase = phaseData.phases?.find((p: any) => p.code === 'settlement');
        settlementPhaseStatus = settlementPhase?.status || 'STANDBY';
      }

      if (settlementRes.ok) {
        const data = await settlementRes.json();
        if (data.settlement) {
          const s = data.settlement;
          setSettlement({
            ...s,
            status: settlementPhaseStatus,  // phase-status API(단일 소스)에서 덮어씀
            planned_revenue: Number(s.planned_revenue || 0),
            planned_cost: Number(s.planned_cost || 0),
            planned_labor_cost: Number(s.planned_labor_cost || 0),
            planned_other_cost: Number(s.planned_other_cost || 0),
            planned_profit: Number(s.planned_profit || 0),
            planned_profit_rate: Number(s.planned_profit_rate || 0),
            actual_revenue: Number(s.actual_revenue || 0),
            actual_cost: Number(s.actual_cost || 0),
            actual_labor_cost: Number(s.actual_labor_cost || 0),
            actual_other_cost: Number(s.actual_other_cost || 0),
            actual_prod_rev_own: Number(s.actual_prod_rev_own || 0),
            actual_prod_rev_ext: Number(s.actual_prod_rev_ext || 0),
            actual_svc_rev_own: Number(s.actual_svc_rev_own || 0),
            actual_svc_rev_ext: Number(s.actual_svc_rev_ext || 0),
            actual_prod_cost_own: Number(s.actual_prod_cost_own || 0),
            actual_prod_cost_ext: Number(s.actual_prod_cost_ext || 0),
            actual_svc_cost_own: Number(s.actual_svc_cost_own || 0),
            actual_svc_cost_ext: Number(s.actual_svc_cost_ext || 0),
            actual_svc_mm_own: Number(s.actual_svc_mm_own || 0),
            actual_svc_mm_ext: Number(s.actual_svc_mm_ext || 0),
            actual_expense_general: Number(s.actual_expense_general || 0),
            actual_expense_special: Number(s.actual_expense_special || 0),
            planned_svc_mm_own: Number(s.planned_svc_mm_own || 0),
            planned_svc_mm_ext: Number(s.planned_svc_mm_ext || 0),
          });

          if (data.expenses && data.expenses.length > 0) {
            setExpenseDetails(data.expenses.map((e: any) => ({
              item: e.item_name,
              planStandard: Number(e.plan_standard || 0),
              planLatest: Number(e.plan_latest || 0),
              execTotal: Number(e.exec_total || 0),
              sellAdmin: Number(e.sell_admin || 0),
              cost: Number(e.cost || 0)
            })));
          }

          setLaborItems((data.labor || []).map((l: any) => ({
            ...l,
            planned_mm: Number(l.planned_mm || 0),
            planned_cost: Number(l.planned_cost || 0),
            actual_mm: Number(l.actual_mm || 0),
            actual_cost: Number(l.actual_cost || 0),
            actual_monthly_allocation: l.actual_monthly_allocation || {},
            affiliation_group: l.affiliation_group,
            actual_internal_amount: Number(l.actual_internal_amount || 0),
          })));

          // 인력계획 상태와 동기화 (기존 로직 보완)
          if (data.labor && data.labor.length > 0) {
            setBaseManpowerPlan(prev => prev.map((p, idx) => {
              // Try matching by index for robust row-level mapping (especially for TBDs)
              const matched = data.labor[idx];
              // Optional: Add a simple check to ensure it's likely the same row, but for TBDs, index is the only way anyway.
              if (matched) {
                return {
                  ...p,
                  id: matched.id,
                  actualMonthlyAllocation: matched.actual_monthly_allocation || {},
                  actualInternalAmount: Number(matched.actual_internal_amount || matched.actual_cost || 0),
                  affiliationGroup: matched.affiliation_group || p.affiliationGroup
                };
              }
              return p;
            }));
          }

          setExtCompanyPlans((data.extCompanies || []).map((c: any) => ({
            id: c.id,
            companyName: c.company_name,
            role1: c.role1,
            role2: c.role2,
            planMM: c.plan_mm || {},
            planAmt: c.plan_amt || {},
            execMM: c.exec_mm || {},
            execAmt: c.exec_amt || {},
          })));

          // 제품/상품 실적 데이터 동기화
          if (data.products && data.products.length > 0) {
            setBaseProductPlan(prev => prev.map((p, idx) => {
              const matched = data.products[idx];
              if (matched) {
                return {
                  ...p,
                  actualProposalPrice: Number(matched.actual_proposal_price || 0),
                  actualCostPrice: Number(matched.actual_cost_price || 0),
                  productPlanId: matched.product_plan_id
                };
              }
              return p;
            }));
            setLatestProductPlan(prev => prev.map((p, idx) => {
              const matched = data.products[idx];
              if (matched) {
                return {
                  ...p,
                  actualProposalPrice: Number(matched.actual_proposal_price || 0),
                  actualCostPrice: Number(matched.actual_cost_price || 0),
                  productPlanId: matched.product_plan_id
                };
              }
              return p;
            }));
          }

        } else {
          // 없으면 수지분석서에서 계획 데이터 가져오기
          await loadProfitabilityData();
        }
      } else {
        await loadProfitabilityData();
      }

      // 기준-경비 합계 및 상세 조회 (일반경비, 특별경비)
      const expRes = await fetch(`/api/projects/${projectId}/profitability-standard-expenses`);
      if (expRes.ok) {
        const expData = await expRes.json();
        const items = expData.items || [];

        // Row ID mapping based on ProjectExpenseTab logic (assuming standard structure)
        // Usually: Row 8 is Total General, Row 9 is Total Special? 
        // Let's verify with View File, but assuming user request context:
        // "General Expense Subtotal" and "Special Expense Subtotal".

        // Temporarily, let's store the raw items or key sums if we can't confirm IDs yet.
        // But better to check.

        const total = items.reduce((sum: number, item: any) => sum + (Number(item.finalAmount) || 0), 0);
        setStandardExpenseTotal(total);
      }
      // 프로젝트 경비 계획 조회 (일반/특별 경비 상세)
      const expPlanRes = await fetch(`/api/projects/${projectId}/expense-plan`);
      if (expPlanRes.ok) {
        const { items } = await expPlanRes.json();
        const general = items
          .filter((i: any) => i.category === '일반경비')
          .reduce((sum: number, i: any) => sum + Object.values(i.monthlyValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0), 0);
        const special = items
          .filter((i: any) => i.category === '특별경비')
          .reduce((sum: number, i: any) => sum + Object.values(i.monthlyValues || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0), 0);

        setExpenseBreakdown({ general, special });
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("데이터 조회 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProfitabilityData = async () => {
    if (isNaN(projectId)) return;

    // /api/profitability?projectId=... 호환성 있는 엔드포인트 사용
    const profitabilityRes = await fetch(`/api/profitability?projectId=${projectId}`);
    if (profitabilityRes.ok) {
      const profData = await profitabilityRes.json();
      if (profData.profitabilities && profData.profitabilities.length > 0) {
        // 가장 최근 버전 사용 (이미 정렬되어 온다고 가정하거나 여기서 정렬)
        const sortedAsc = [...profData.profitabilities].sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          if (dateA !== dateB) return dateA - dateB; // 오름차순 (최초순)
          return a.id - b.id;
        });

        const first = sortedAsc[0];

        setSettlement(prev => ({
          ...prev,
          profitability_id: first.id,
          planned_revenue: Number(first.total_revenue || first.revenue || 0),
          planned_cost: Number(first.total_cost || 0),
          planned_labor_cost: Number(first.labor_cost || first.internal_labor_cost || 0),
          planned_other_cost: Number(first.other_cost || first.expense_cost || 0),
          planned_profit: Number(first.net_profit || first.profit || 0),
          planned_profit_rate: Number(first.profit_rate || 0),
          // Initialize actual details to 0 if new
          actual_prod_rev_own: 0,
          actual_prod_rev_ext: 0,
          actual_svc_rev_own: 0,
          actual_svc_rev_ext: 0,
          actual_prod_cost_own: 0,
          actual_prod_cost_ext: 0,
          actual_svc_cost_own: 0,
          actual_svc_cost_ext: 0,
          actual_svc_mm_own: 0,
          actual_svc_mm_ext: 0,
          actual_expense_general: 0,
          actual_expense_special: 0,
          planned_svc_mm_own: Number(first.our_mm || 0),
          planned_svc_mm_ext: Number(first.others_mm || 0),
        }));

        // 인력 계획 데이터 가져오기 (정산 초기 데이터로 활용)
        const manpowerRes = await fetch(`/api/projects/${projectId}/manpower-plan`);
        if (manpowerRes.ok) {
          const manpowerData = await manpowerRes.json();
          if (manpowerData.items && manpowerData.items.length > 0) {
            const laborData: LaborItem[] = manpowerData.items.map((item: any) => ({
              user_id: item.userId,
              user_name: item.name || "",
              role: item.role || item.detailedTask || "",
              planned_mm: item.monthlyAllocation ? Object.values(item.monthlyAllocation).reduce((a: any, b: any) => a + Number(b), 0) : 0,
              planned_cost: Number(item.internalAmount || 0),
              actual_mm: 0,
              actual_cost: 0,
            }));
            setLaborItems(laborData);

            // 외주 업체 데이터 초기화
            const extManpower = manpowerData.items.filter((item: any) => (item.affiliationGroup || '').startsWith('외주'));
            if (extManpower.length > 0) {
              const extPlans = extManpower.map((item: any, idx: number) => {
                // 월별 금액 계산 (계획된 M/M * 단가)
                const planAmt: Record<string, string> = {};
                if (item.monthlyAllocation) {
                  Object.entries(item.monthlyAllocation).forEach(([m, mm]: [string, any]) => {
                    const amt = Math.round((Number(mm) || 0) * (item.internalUnitPrice || 0));
                    if (amt > 0) planAmt[m] = amt.toString();
                  });
                }

                return {
                  id: -(idx + 1),
                  companyName: item.affiliationGroup || "",
                  role1: item.role || "",
                  role2: item.detailedTask || "",
                  planMM: item.monthlyAllocation || {},
                  planAmt: planAmt,
                  execMM: {},
                  execAmt: {},
                };
              });
              setExtCompanyPlans(extPlans);
            }
          }
        }
      }
    }
  };

  // ✅ 작성완료: confirm → onCompleteSuccess() (advance-phase API)
  const handleComplete = () => {
    if (!settlement.id) {
      showToast("먼저 저장을 해주세요.", "error");
      return;
    }
    showAlert(
      "정산서 작성을 완료하시겠습니까? 완료 후에는 수정이 불가능합니다.",
      "confirm",
      "작성 완료",
      async () => {
        try {
          showToast("정산 작성이 완료되었습니다.", "success");
          await onCompleteSuccess();
          fetchData();
        } catch (e) {
          console.error(e);
          showToast("오류가 발생했습니다.", "error");
        }
      }
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Map baseManpowerPlan to LaborItems for saving
      const laborToSave = baseManpowerPlan.map(item => {
        const actualTotalMM = Object.values(item.actualMonthlyAllocation || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        const plannedTotalMM = Object.values(item.monthlyAllocation || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);

        return {
          id: item.id,
          user_id: item.userId ? Number(item.userId) : null,
          user_name: item.name || '',
          role: item.role || item.detailedTask || '',
          affiliation_group: item.affiliationGroup,
          planned_mm: plannedTotalMM,
          planned_cost: item.internalAmount || 0,
          actual_mm: actualTotalMM,
          actual_cost: item.actualInternalAmount != null
            ? item.actualInternalAmount
            : Math.round((item.internalUnitPrice || 0) * actualTotalMM),
          actual_monthly_allocation: item.actualMonthlyAllocation || {},
          actual_internal_amount: item.actualInternalAmount || 0
        };
      });

      // Prepare products for saving
      const productsToSave = baseProductPlan.map(item => ({
        productPlanId: item.productPlanId || item.id,
        type: item.type,
        companyName: item.companyName,
        productName: item.productName,
        plannedProposalPrice: item.proposalPrice,
        plannedCostPrice: item.costPrice,
        actualProposalPrice: item.actualProposalPrice || 0,
        actualCostPrice: item.actualCostPrice || 0
      }));


      // Calculate total actuals before saving
      const totalActualMMOwn = manpowerSummaries[0].totalActualMM;
      const totalActualMMExt = manpowerSummaries[1].totalActualMM;
      const totalActualLaborCostOwn = manpowerSummaries[0].totalActualAmount;
      const totalActualLaborCostExt = manpowerSummaries[1].totalActualAmount;
      const totalActualRevenue =
        Number(settlement.actual_prod_rev_own || 0) +
        Number(settlement.actual_prod_rev_ext || 0) +
        Number(settlement.actual_svc_rev_own || 0) +
        Number(settlement.actual_svc_rev_ext || 0);
      const actualPurchase = Number(settlement.actual_prod_cost_ext || 0);
      const actualExpense = Number(settlement.actual_expense_general || 0) + Number(settlement.actual_expense_special || 0);
      const totalActualCost = actualPurchase + totalActualLaborCostOwn + totalActualLaborCostExt + actualExpense;
      const calculatedActualProfit = totalActualRevenue - totalActualCost;
      const calculatedActualProfitRate = totalActualRevenue > 0 ? (calculatedActualProfit / totalActualRevenue) * 100 : 0;

      const response = await fetch(`/api/projects/${projectId}/settlement`, {
        method: settlement.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlement: {
            ...settlement,
            // Calculated Actuals
            actual_revenue: totalActualRevenue,
            actual_cost: totalActualCost,
            actual_profit: calculatedActualProfit,
            actual_profit_rate: calculatedActualProfitRate,
            actual_svc_mm_own: Number(settlement.actual_svc_mm_own || 0) || totalActualMMOwn,
            actual_svc_mm_ext: Number(settlement.actual_svc_mm_ext || 0) || totalActualMMExt,
            actual_labor_cost: totalActualLaborCostOwn + totalActualLaborCostExt,
            actual_other_cost: actualExpense,
            // Ensure planned fields are always from Base Plan as requested
            planned_revenue: baseRevenue,
            planned_profit: baseProfitCalculated,
            planned_profit_rate: baseProfitRateCalculated,
            planned_svc_mm_own: baseInternalMM,
            planned_svc_mm_ext: baseExternalMM,
            created_by: currentUser?.id || 1,
          },
          labor: laborToSave,
          extCompanies: extCompanyPlans,
          products: productsToSave,
          expenses: expenseDetails
        }),
      });


      if (response.ok) {
        showToast("수지정산서가 저장되었습니다.", "success");
        // ✅ 훅 표준 메서드 사용: STANDBY → IN_PROGRESS 자동 전환
        await onSaveSuccess();
        fetchData();
      } else {
        showToast("저장 실패", "error");
      }
    } catch (error) {
      console.error("Error saving:", error);
      showToast("저장 중 오류 발생", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!settlement.id) return;

    showAlert(
      "이 수지정산서를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.",
      "confirm",
      "삭제 확인",
      async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/settlement`, {
            method: "DELETE",
          });

          if (response.ok) {
            showToast("삭제되었습니다.", "success");
            router.push("/settlement");
          } else {
            const error = await response.json();
            showToast(`삭제 실패: ${error.error}`, "error");
          }
        } catch (error) {
          console.error("Error deleting settlement:", error);
          showToast("삭제 중 오류가 발생했습니다.", "error");
        }
      }
    );
  };

  // 인력 합계
  const totalPlannedMM = laborItems.reduce((sum, item) => sum + item.planned_mm, 0);
  const totalPlannedLaborCost = laborItems.reduce((sum, item) => sum + item.planned_cost, 0);

  // 실적은 입력된 값 기준 (Actuals from inputs)
  const totalActualMM = (Number(settlement.actual_svc_mm_own) || 0) + (Number(settlement.actual_svc_mm_ext) || 0);
  const totalActualLaborCost = settlement.actual_labor_cost;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // Constants for dropdowns
  const distinctAffiliationGroups = [
    "위엠비_컨설팅",
    "위엠비_개발",
    "외주_컨설팅",
    "외주_개발",
  ];

  const distinctJobLevels = [
    "상무",
    "이사",
    "수석(L)",
    "부장",
    "차부장",
    "수석(S)",
    "차장",
    "책임(M)",
    "과장",
    "책임(A)",
    "대리",
    "사원",
  ];

  const distinctGrades = [
    "개_특",
    "개_고",
    "개_중",
    "개_초",
    "컨_특",
    "컨_고",
    "컨_중",
    "컨_초",
  ];

  const handleManpowerChange = (id: number, field: keyof ManpowerPlanItem, value: any) => {
    setBaseManpowerPlan(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // Handle name change for auto-fill
        if (field === 'name') {
          const user = users.find(u => u.name === value);
          if (user) {
            // Auto-fill logic
            const jobLevel = mapRankToJobLevel(user.rankName);
            const grade = user.grade || getDefaultGradeByRank(user.rankName);
            const affiliation = determineAffiliationGroup(user.departmentName, null);

            updatedItem.userId = user.id;
            if (jobLevel) updatedItem.wmbRank = jobLevel;
            if (grade) updatedItem.grade = grade;
            updatedItem.affiliationGroup = affiliation;

            if (affiliation.includes('위엠비')) {
              updatedItem.companyName = '(주)위엠비';
            }

            // 내부단가 매칭
            const matchedPrice = projectUnitPrices.find(
              up => up.affiliationGroup === affiliation && up.jobLevel === jobLevel
            );
            if (matchedPrice) {
              updatedItem.internalUnitPrice = matchedPrice.internalApplied;
            }
          }
        }

        // Handle affiliationGroup change to update companyName if needed
        if (field === 'affiliationGroup') {
          if (typeof value === 'string' && value.includes('위엠비')) {
            updatedItem.companyName = '(주)위엠비';
          } else if (typeof value === 'string' && value.includes('외주')) {
            updatedItem.companyName = ''; // Clear company name for external, user can fill
          }
        }

        // Update internalUnitPrice when criteria change
        if (field === 'affiliationGroup' || field === 'wmbRank') {
          const matchedPrice = projectUnitPrices.find(
            up => up.affiliationGroup === (field === 'affiliationGroup' ? value : (item.affiliationGroup || '')) &&
              up.jobLevel === (field === 'wmbRank' ? value : (item.wmbRank || ''))
          );
          if (matchedPrice) {
            updatedItem.internalUnitPrice = matchedPrice.internalApplied;
          }
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const handleProductActualChange = (index: number, group: 'internal' | 'external', field: 'actualProposalPrice' | 'actualCostPrice', value: string) => {
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    const typeLabel = group === 'internal' ? '자사' : '타사';

    setBaseProductPlan(prev => {
      const newPlan = [...prev];
      const items = newPlan.filter(item => item.type === typeLabel);
      if (items[index]) {
        const originalIndex = newPlan.indexOf(items[index]);
        if (originalIndex !== -1) {
          newPlan[originalIndex] = { ...newPlan[originalIndex], [field]: numValue };
        }
      }
      return newPlan;
    });

    // Sync with latest plan if available
    setLatestProductPlan(prev => {
      const newPlan = [...prev];
      const items = newPlan.filter(item => item.type === typeLabel);
      if (items[index]) {
        const originalIndex = newPlan.indexOf(items[index]);
        if (originalIndex !== -1) {
          newPlan[originalIndex] = { ...newPlan[originalIndex], [field]: numValue };
        }
      }
      return newPlan;
    });
  };

  const handleActualAllocationChange = (id: number, month: string, value: string) => {
    setBaseManpowerPlan(prev => prev.map(item => {
      if (item.id === id) {
        const newAllocation = {
          ...item.actualMonthlyAllocation || {},
          [month]: value
        };
        const newTotalMM = Object.values(newAllocation).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        const autoAmount = Math.round((item.internalUnitPrice || 0) * newTotalMM);

        return {
          ...item,
          actualMonthlyAllocation: newAllocation,
          actualInternalAmount: autoAmount
        };
      }
      return item;
    }));
  };

  const handleMonthlyValueChange = (id: number, field: string, month: string, value: string) => {
    setBaseManpowerPlan(prev => prev.map(item => {
      if (item.id === id) {
        const targetField = field as keyof ManpowerPlanItem;
        const currentData = (item[targetField] || {}) as { [key: string]: any };
        return {
          ...item,
          [targetField]: {
            ...currentData,
            [month]: value
          }
        };
      }
      return item;
    }));
  };

  const deleteManpowerRow = (id: number) => {
    setBaseManpowerPlan(prev => prev.filter(item => item.id !== id));
  };

  const addExtCompanyRow = () => {
    const newId = Date.now();
    setExtCompanyPlans(prev => [...prev, {
      id: newId,
      companyName: '',
      role1: '',
      role2: '',
      planMM: {},
      planAmt: {},
      execMM: {},
      execAmt: {},
    }]);
  };

  const deleteExtCompanyRow = (id: number) => {
    setExtCompanyPlans(prev => prev.filter(item => item.id !== id));
  };

  const handleExtCompanyChange = (id: number, field: keyof ExtCompanyPlan, value: any) => {
    setExtCompanyPlans(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleExtValueChange = (id: number, field: 'planMM' | 'planAmt' | 'execMM' | 'execAmt', month: string, value: string) => {
    setExtCompanyPlans(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [field]: {
            ...item[field],
            [month]: value
          }
        };
      }
      return item;
    }));
  };

  const handleExpenseChange = (index: number, field: keyof ExpenseDetail, value: string) => {
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    setExpenseDetails(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newItem = { ...item, [field]: numValue };
        // 판관(sellAdmin) 또는 원가(cost) 변경 시 실행 합계(execTotal) 자동 계산
        if (field === 'sellAdmin' || field === 'cost') {
          newItem.execTotal = (newItem.sellAdmin || 0) + (newItem.cost || 0);
        }
        return newItem;
      }
      return idx === index ? { ...item, [field]: numValue } : item;
    }));
  };

  const deleteMonthAtEnd = () => {
    if (monthColumns.length === 0) return;
    setMonthColumns(prev => prev.slice(0, -1));
  };

  const deleteMonthAtStart = () => {
    if (monthColumns.length === 0) return;
    setMonthColumns(prev => prev.slice(1));
  };

  const addMonthAtEnd = () => {
    if (monthColumns.length === 0) {
      // Default start
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      setMonthColumns([`${year}-${String(month).padStart(2, '0')}`]);
      return;
    }
    const lastMonth = monthColumns[monthColumns.length - 1];
    const [year, month] = lastMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1); // month is 1-indexed from split, so new Date(year, month, 1) gives next month

    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    setMonthColumns([...monthColumns, nextMonthStr]);
  };

  const addMonthAtStart = () => {
    if (monthColumns.length === 0) {
      // Default start
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      setMonthColumns([`${year}-${String(month).padStart(2, '0')}`]);
      return;
    }
    const firstMonth = monthColumns[0];
    const [year, month] = firstMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month is 1-based. To get previous month: (month-1) is current in 0-based, so (month-2) is previous.

    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    setMonthColumns([prevMonthStr, ...monthColumns]);
  };

  const addManpowerRow = () => {
    const newId = baseManpowerPlan.length > 0 ? Math.max(...baseManpowerPlan.map(i => i.id || 0)) + 1 : 1;
    const newItem: ManpowerPlanItem = {
      id: newId,
      projectName: '',
      role: '',
      detailedTask: '',
      companyName: '',
      affiliationGroup: '',
      wmbRank: '',
      grade: '',
      name: '',
      userId: null,
      monthlyAllocation: {},
      proposedUnitPrice: null,
      proposedAmount: null,
      internalUnitPrice: null,
      internalAmount: null,
      actualMonthlyAllocation: {},
      isNew: true,
    };
    // Initialize monthly allocation for existing columns
    monthColumns.forEach(month => {
      if (!newItem.monthlyAllocation) newItem.monthlyAllocation = {};
      newItem.monthlyAllocation[month] = 0;
    });

    setBaseManpowerPlan([...baseManpowerPlan, newItem]);
  };

  // 인력계획 요약 계산 로직
  const getManpowerSummary = () => {
    const categories = [
      { label: '내부', filter: (i: ManpowerPlanItem) => (i.affiliationGroup || '').startsWith('위엠비') },
      { label: '외부', filter: (i: ManpowerPlanItem) => (i.affiliationGroup || '').startsWith('외주') },
      { label: '전체', filter: () => true },
    ];

    return categories.map(cat => {
      const items = baseManpowerPlan.filter(cat.filter);

      const planMonthly = monthColumns.map(m =>
        items.reduce((sum, item) => sum + (item.monthlyAllocation?.[m] || 0), 0)
      );
      const actualMonthly = monthColumns.map(m =>
        items.reduce((sum, item) => sum + (Number(item.actualMonthlyAllocation?.[m]) || 0), 0)
      );

      const totalPlanMM = planMonthly.reduce((s, v) => s + v, 0);
      const totalActualMM = actualMonthly.reduce((s, v) => s + v, 0);

      const totalPlanAmount = Math.round(items.reduce((sum: number, item) => {
        const mm = Object.values(item.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
        const amount = item.internalAmount != null ? item.internalAmount : (item.internalUnitPrice || 0) * mm;
        return sum + amount;
      }, 0));

      const totalActualAmount = Math.round(items.reduce((sum: number, item) => {
        const mm = Object.values(item.actualMonthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
        const amount = item.actualInternalAmount != null ? item.actualInternalAmount : (item.internalUnitPrice || 0) * mm;
        return sum + amount;
      }, 0));

      return {
        label: cat.label,
        planMonthly,
        actualMonthly,
        totalPlanMM,
        totalActualMM,
        totalPlanAmount,
        totalActualAmount
      };
    });
  };

  const manpowerSummaries = getManpowerSummary();

  // Calculation Logic for Order Summary
  const calcSummary = (
    manpower: ManpowerPlanItem[],
    products: ProductPlanItem[],
    planSummary: SummaryData | null
  ) => {
    // Revenue
    const prodRevOwn = products.filter(i => i.type === '자사').reduce((sum, i) => sum + (i.proposalPrice || 0), 0);
    const prodRevExt = products.filter(i => i.type === '타사').reduce((sum, i) => sum + (i.proposalPrice || 0), 0);

    const svcRevOwn = Math.round(manpower.filter(i => (i.affiliationGroup || '').startsWith('위엠비')).reduce((sum, i) => {
      const mm = Object.values(i.monthlyAllocation || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      return sum + (i.proposedAmount ?? (i.proposedUnitPrice || 0) * mm);
    }, 0));
    const svcRevExt = Math.round(manpower.filter(i => !(i.affiliationGroup || '').startsWith('위엠비')).reduce((sum, i) => {
      const mm = Object.values(i.monthlyAllocation || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      return sum + (i.proposedAmount ?? (i.proposedUnitPrice || 0) * mm);
    }, 0));

    // Cost and MM
    let internalMM = 0;
    let externalMM = 0;

    const svcCostOwn = Math.round(manpower.filter(i => !(i.affiliationGroup || '').startsWith('외주')).reduce((sum, i) => {
      const mm = Object.values(i.monthlyAllocation || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      internalMM += mm;
      return sum + (i.internalAmount ?? (i.internalUnitPrice || 0) * mm);
    }, 0));
    const svcCostExt = Math.round(manpower.filter(i => (i.affiliationGroup || '').startsWith('외주')).reduce((sum, i) => {
      const mm = Object.values(i.monthlyAllocation || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      externalMM += mm;
      return sum + (i.internalAmount ?? (i.internalUnitPrice || 0) * mm);
    }, 0));

    const prodCostOwn = products.filter(i => i.type === '자사').reduce((sum, i) => sum + (i.costPrice || 0), 0);
    const prodCostExt = products.filter(i => i.type === '타사').reduce((sum, i) => sum + (i.costPrice || 0), 0);

    // Expense
    const expenseTotal = planSummary?.expense_cost || 0;

    return {
      prodRevOwn, prodRevExt,
      svcRevOwn, svcRevExt,
      total_revenue: prodRevOwn + prodRevExt + svcRevOwn + svcRevExt,
      prodCostOwn, prodCostExt,
      svcCostOwn, svcCostExt,
      expense_cost: expenseTotal,
      internalMM, externalMM,
      profit: (prodRevOwn + prodRevExt + svcRevOwn + svcRevExt) - (prodCostOwn + prodCostExt + svcCostOwn + svcCostExt + expenseTotal),
      profit_rate: (prodRevOwn + prodRevExt + svcRevOwn + svcRevExt) > 0 ? (((prodRevOwn + prodRevExt + svcRevOwn + svcRevExt) - (prodCostOwn + prodCostExt + svcCostOwn + svcCostExt + expenseTotal)) / (prodRevOwn + prodRevExt + svcRevOwn + svcRevExt)) * 100 : 0
    };
  };

  const baseSum = calcSummary(baseManpowerPlan, baseProductPlan, basePlanSummary);
  const latestSum = calcSummary(latestManpowerPlan, latestProductPlan, latestPlanSummary);

  // (2) 수주내용 요약 바인딩용 변수 (매입, 인력, 경비 데이터 바인딩 및 이익 재계산)
  // Base Plan
  const basePurchase = baseSum.prodCostExt;
  const baseInternalMM = baseSum.internalMM;
  const baseInternalCost = baseSum.svcCostOwn;
  const baseExternalMM = baseSum.externalMM;
  const baseExternalCost = baseSum.svcCostExt;
  const baseExpense = Math.round(expenseBreakdown.general + expenseBreakdown.special);

  const baseProdRev = baseSum.prodRevOwn + baseSum.prodRevExt;
  const baseSvcRev = baseSum.svcRevOwn + baseSum.svcRevExt;
  const baseRevenue = baseProdRev + baseSvcRev;
  const baseProfitCalculated = baseRevenue - (basePurchase + baseInternalCost + baseExternalCost + baseExpense);
  const baseProfitRateCalculated = baseRevenue > 0 ? (baseProfitCalculated / baseRevenue) * 100 : 0;

  // Latest Plan
  const latestPurchase = latestSum.prodCostExt;
  const latestInternalMM = latestSum.internalMM;
  const latestInternalCost = latestSum.svcCostOwn;
  const latestExternalMM = latestSum.externalMM;
  const latestExternalCost = latestSum.svcCostExt;
  const latestExpense = Math.round(latestSum.expense_cost);

  const latestRevenue = latestPlanSummary?.total_revenue || 0;
  const latestProfitCalculated = latestRevenue - (latestPurchase + latestInternalCost + latestExternalCost + latestExpense);
  const latestProfitRateCalculated = latestRevenue > 0 ? (latestProfitCalculated / latestRevenue) * 100 : 0;



  // (1) Settlement Result Diff
  // (3) Actual (Execution) Totals
  const totalActualMMOwn = Number(settlement.actual_svc_mm_own || 0);
  const totalActualMMExt = Number(settlement.actual_svc_mm_ext || 0);
  const totalActualLaborCostOwn = Number(settlement.actual_svc_cost_own || 0);
  const totalActualLaborCostExt = Number(settlement.actual_svc_cost_ext || 0);

  const totalActualProdRev = (Number(settlement.actual_prod_rev_own) || 0) + (Number(settlement.actual_prod_rev_ext) || 0);
  const totalActualSvcRev = (Number(settlement.actual_svc_rev_own) || 0) + (Number(settlement.actual_svc_rev_ext) || 0);
  const totalActualRevenue = totalActualProdRev + totalActualSvcRev;

  const actualPurchase = Number(settlement.actual_prod_cost_ext || 0);
  const actualExpense = Number(settlement.actual_expense_general || 0) + Number(settlement.actual_expense_special || 0);

  const totalActualCostValue = actualPurchase + totalActualLaborCostOwn + totalActualLaborCostExt + actualExpense + Number(settlement.actual_biz_cost_indirect || 0);
  const calculatedActualProfit = totalActualRevenue - totalActualCostValue + (Number(settlement.actual_extra_revenue || 0) - Number(settlement.actual_extra_cost || 0));
  const calculatedActualProfitRate = totalActualRevenue > 0 ? (calculatedActualProfit / totalActualRevenue) * 100 : 0;



  const revenueDiff = totalActualRevenue - baseRevenue;
  const costDiff = totalActualCostValue - (basePurchase + baseInternalCost + baseExternalCost + baseExpense);
  const profitDiff = calculatedActualProfit - baseProfitCalculated;
  const profitRateDiff = calculatedActualProfitRate - baseProfitRateCalculated;

  // ✅ 완료 상태(isFinalStatus)이면 ReadOnly — 하드코딩 상태 비교 금지 (workflow 표준)
  const isReadOnly = isFinalStatus;

  return (
    <div className="space-y-6">
      {/* 헤더 - 수지분석서와 동일한 형식 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settlement")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px] leading-snug">
                <span className="text-blue-600">수지정산서</span> - {projectName}
              </h1>
              <StatusBadge
                status={phaseStatus}
                className="h-9"
              />
              <ProjectPhaseNav projectId={projectId} />
            </div>
            <p className="text-sm text-gray-600">
              {projectCode} | {customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 삭제: 진행 중(not 초기, not 완료) 상태에서만 */}
          {!isInitialStatus && !isFinalStatus && settlement.id && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}

          {/* 엑셀: 시작 후(not 초기) 상태에서 표시 */}
          {!isInitialStatus && (
            <Button
              variant="secondary"
              className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-600/90 border-transparent hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4" />
              엑셀
            </Button>
          )}

          {/* 작성완료: 진행 중 상태에서만 */}
          {!isInitialStatus && !isFinalStatus && (
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              작성완료
            </Button>
          )}
        </div>
      </div>

      {/* Summary Calculation Logic */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* 작성 기준 일자 */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">작성 기준 일자</span>
              <DatePicker
                date={settlement.settlement_date ? new Date(settlement.settlement_date) : undefined}
                setDate={(date) => setSettlement({ ...settlement, settlement_date: date ? format(date, "yyyy-MM-dd") : "" })}
                disabled={isReadOnly}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">승인일</span>
              <DatePicker
                date={settlement.approved_date ? new Date(settlement.approved_date) : undefined}
                setDate={(date) => setSettlement({ ...settlement, approved_date: date ? format(date, "yyyy-MM-dd") : "" })}
                disabled={isReadOnly}
                className="w-36"
              />
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? "저장 중..." : "저장"}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. 프로젝트 개요 */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-red-600">1. 프로젝트 개요</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-[14px] table-fixed">
                <colgroup>
                  <col className="w-[220px]" />
                  <col />
                  <col className="w-[220px]" />
                  <col />
                </colgroup>
                <tbody>
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">프로젝트명</td>
                    <td className="border border-gray-300 px-[10px] text-sm text-gray-900 truncate">{projectName}</td>
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">고객명</td>
                    <td className="border border-gray-300 px-[10px] text-sm text-gray-900 truncate">{customerName}</td>
                  </tr>
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">기준 계획 수지분석서</td>
                    <td className="border border-gray-300 px-[10px]">
                      {firstProfitabilityId ? (
                        <a
                          href={`/projects/${projectId}/profitability`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate block"
                        >
                          WEMB-수지분석서-{((firstProfitabilityApprovedDate || '').split('T')[0] || '').replace(/-/g, '') || '00000000'}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">없음</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">최종 변경 수지분석서</td>
                    <td className="border border-gray-300 px-[10px]">
                      {latestProfitabilityId ? (
                        firstProfitabilityId === latestProfitabilityId ? (
                          <span className="text-gray-600 text-sm">변경 없음</span>
                        ) : (
                          <a
                            href={`/projects/${projectId}/profitability`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm truncate block"
                          >
                            WEMB-수지분석서-{((latestProfitabilityApprovedDate || '').split('T')[0] || '').replace(/-/g, '') || '00000000'}
                          </a>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">없음</span>
                      )}
                    </td>
                  </tr>
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">매출액</td>
                    <td className="border border-gray-300 px-[10px] text-left text-sm text-gray-900">
                      {Math.floor(totalRevenue || latestPlanSummary?.total_revenue || 0).toLocaleString()} (천원)
                    </td>
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">구축 기간</td>
                    <td className="border border-gray-300 px-[10px]">
                      <div className="text-sm text-gray-900">
                        {contractStartDate || ''} ~ {contractEndDate || ''}
                      </div>
                    </td>
                  </tr>
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">담당 PM</td>
                    <td className="border border-gray-300 px-[10px] text-sm text-gray-900 truncate">
                      {managerName} {managerPosition}
                    </td>
                    <td className="border border-gray-300 px-[10px] bg-blue-50/50 font-bold text-center text-sm">영업 담당</td>
                    <td className="border border-gray-300 px-[10px] text-sm text-gray-900 truncate">
                      {salesPersonName} {salesPersonPosition}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. 수주 내용 요약 및 수지차 */}
          <div className="space-y-4 text-[14px]">
            <h2 className="text-base font-bold text-red-600">2. 수주 내용 요약 및 수지차</h2>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-gray-800">(1) 정산 결과</p>
                <div className="text-gray-600 text-[14px]">[단위 : 천원, %]</div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 영업이익 증감액 카드 */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${profitDiff >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">기준 계획대비 영업이익 증감액</p>
                      <p className={`mt-1 text-2xl font-bold ${profitDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profitDiff.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 매출이익 증감율 카드 */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${profitRateDiff >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">기준 계획대비 매출이익 증감율</p>
                      <p className={`mt-1 text-2xl font-bold ${profitRateDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profitRateDiff.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[14px] text-gray-500 mt-3">※ 기준 계획 : 전자결재가 완료 된 최초의 수지분석서.</p>
            </div>

            {/* (2) 수주 내용 요약 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">(2) 수주 내용 요약</p>
                <div className="text-gray-600 text-[14px]">[단위 : 천원, %]</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-[14px] text-center table-fixed">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <thead>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th colSpan={2} rowSpan={2} className="border border-gray-300 px-1 py-[4px] whitespace-nowrap text-[14px]">구분</th>
                      <th colSpan={3} className="border border-gray-300 px-1 py-[4px] text-[14px]">매출액</th>
                      <th rowSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">매입액</th>
                      <th colSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">내부 인력</th>
                      <th colSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">외주인력</th>
                      <th rowSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">비용</th>
                      <th rowSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">정산 후<br />영업이익의 30%</th>
                      <th colSpan={2} className="border border-gray-300 px-1 py-[4px] text-[14px]">영업 이익</th>
                    </tr>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">상품매출</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">용역매출</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">합계</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">M/M</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">금액</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">M/M</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">금액</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">금액</th>
                      <th className="border border-gray-300 px-1 py-[4px] text-[14px]">매출이익율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 계획 - 기준 계획 */}
                    <tr className="bg-[#FFFFCC]">
                      <td rowSpan={2} className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] font-medium text-center text-[14px]">계획</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] text-center text-[14px]">기준 계획</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseProdRev.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseSvcRev.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-medium text-[14px]">{baseRevenue.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{basePurchase.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseInternalMM.toFixed(2)}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseInternalCost.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseExternalMM.toFixed(2)}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseExternalCost.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseExpense.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{(extraData.baseExtraRevenue - extraData.baseExtraExpense).toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{baseProfitCalculated.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-center text-[14px]">{baseProfitRateCalculated.toFixed(2)}%</td>
                    </tr>
                    {/* 계획 - 최종 변경 */}
                    <tr className="bg-[#FFFFCC]">
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] text-center text-[14px]">최종 변경</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestPlanSummary?.prodRevOwn.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestPlanSummary?.svcRevOwn.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-medium text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestPlanSummary?.total_revenue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestPurchase.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestInternalMM.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestInternalCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestExternalMM.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestExternalCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestExpense.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{(extraData.latestExtraRevenue - extraData.latestExtraExpense).toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : latestProfitCalculated.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-center text-[14px]">
                        {firstProfitabilityId === latestProfitabilityId ? "-" : `${latestProfitRateCalculated.toFixed(2)}%`}
                      </td>
                    </tr>
                    {/* 정산 - 실행 합계 */}
                    <tr className="border-[2px] border-emerald-800 bg-[#EBF1DE]">
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] font-medium text-center text-[14px]">정산</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] text-center text-[14px]">실행 합계</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualProdRev.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualSvcRev.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-bold text-[14px]">{totalActualRevenue.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {actualPurchase.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualMMOwn.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualLaborCostOwn.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualMMExt.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualLaborCostExt.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{actualExpense.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {((settlement.actual_extra_revenue || 0) - (settlement.actual_extra_cost || 0)).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-bold text-[14px]">{calculatedActualProfit.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-center font-bold text-[14px]">{calculatedActualProfitRate.toFixed(2)}%</td>
                    </tr>
                    {/* 정산_2 - 실행 합계 */}
                    <tr className="border-[2px] border-emerald-800 bg-[#EBF1DE]">
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] font-medium text-center text-[14px]">정산_2</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] bg-[#DAEEF3] text-center text-[14px]">실행 합계</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualProdRev.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualSvcRev.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-bold text-[14px]">{totalActualRevenue.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {actualPurchase.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualMMOwn.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualLaborCostOwn.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualMMExt.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {totalActualLaborCostExt.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">{actualExpense.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right text-[14px]">
                        {((settlement.actual_extra_revenue || 0) - (settlement.actual_extra_cost || 0)).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-right font-bold text-[14px]">{calculatedActualProfit.toLocaleString()}</td>
                      <td className="border border-gray-300 px-[10px] py-[4px] text-center font-bold text-[14px]">{calculatedActualProfitRate.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* (3) 수주차 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">(3) 수주차</p>
                <div className="text-gray-600 text-[14px]">[단위 : 천원, %]</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-[14px] text-center table-fixed">
                  <colgroup>
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[180px]" />
                    <col className="w-[180px]" />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th colSpan={3} className="border border-gray-400 py-[4px] font-bold px-4 text-[14px]">구분</th>
                      <th className="border border-gray-400 py-[4px] font-bold px-4 text-[14px]">계획_기준 계획</th>
                      <th className="border border-gray-400 py-[4px] font-bold px-4 text-[14px]">계획_최종 변경</th>
                      <th className="border border-gray-400 py-[4px] font-bold px-4 text-[14px]">실적</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 매출 섹션 */}
                    <tr>
                      <td rowSpan={7} className="border border-gray-400 bg-[#D9D9D9] font-bold py-[4px] text-[14px]">매출</td>
                      <td rowSpan={3} className="border border-gray-400 bg-white py-[4px] text-[14px]">상품 매출</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-[4px] text-[14px]">자사 제품</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{baseSum.prodRevOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{latestSum.prodRevOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_prod_rev_own' && (settlement.actual_prod_rev_own || 0) === 0 ? "" : ((settlement.actual_prod_rev_own || 0) === 0 ? "0" : (settlement.actual_prod_rev_own || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_prod_rev_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_prod_rev_own: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-[4px] text-[14px]">타사 상품</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{baseSum.prodRevExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{latestSum.prodRevExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_prod_rev_ext' && (settlement.actual_prod_rev_ext || 0) === 0 ? "" : ((settlement.actual_prod_rev_ext || 0) === 0 ? "0" : (settlement.actual_prod_rev_ext || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_prod_rev_ext')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_prod_rev_ext: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9]">
                      <td className="border border-gray-400 text-left px-4 py-[4px] text-[14px]">소계</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] font-bold text-[14px]">{(baseSum.prodRevOwn + baseSum.prodRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] font-bold text-[14px]">{(latestSum.prodRevOwn + latestSum.prodRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#D9D9D9] text-right px-4 py-[4px] font-bold text-[14px]">
                        {((settlement.actual_prod_rev_own || 0) + (settlement.actual_prod_rev_ext || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td rowSpan={3} className="border border-gray-400 bg-white py-[4px] text-[14px]">용역매출</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-[4px] text-[14px]">자사 인력</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{baseSum.svcRevOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{latestSum.svcRevOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_svc_rev_own' && (settlement.actual_svc_rev_own || 0) === 0 ? "" : ((settlement.actual_svc_rev_own || 0) === 0 ? "0" : (settlement.actual_svc_rev_own || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_svc_rev_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_svc_rev_own: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-[4px] text-[14px]">외주 인력</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{baseSum.svcRevExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-[4px] text-[14px]">{latestSum.svcRevExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_svc_rev_ext' && (settlement.actual_svc_rev_ext || 0) === 0 ? "" : ((settlement.actual_svc_rev_ext || 0) === 0 ? "0" : (settlement.actual_svc_rev_ext || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_svc_rev_ext')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_svc_rev_ext: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9]">
                      <td className="border border-gray-400 text-left px-4 py-[4px] text-[14px]">소계</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] font-bold text-[14px]">{(baseSum.svcRevOwn + baseSum.svcRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] font-bold text-[14px]">{(latestSum.svcRevOwn + latestSum.svcRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#D9D9D9] text-right px-4 py-[4px] font-bold text-[14px]">
                        {((settlement.actual_svc_rev_own || 0) + (settlement.actual_svc_rev_ext || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-[4px] text-[14px]">매출액 소계</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] text-[14px]">{(baseSum.prodRevOwn + baseSum.prodRevExt + baseSum.svcRevOwn + baseSum.svcRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 text-right px-4 py-[4px] text-[14px]">{(latestSum.prodRevOwn + latestSum.prodRevExt + latestSum.svcRevOwn + latestSum.svcRevExt).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#D9D9D9] text-right px-4 py-[4px] text-[14px] font-bold">
                        {settlement.actual_revenue.toLocaleString()}
                      </td>
                    </tr>

                    {/* 상품 매출 원가 섹션 */}
                    <tr>
                      <td rowSpan={5} className="border border-gray-400 bg-[#D9D9D9] font-bold py-2 text-[14px]">상품 매출 원가</td>
                      <td rowSpan={2} className="border border-gray-400 bg-white py-2 text-[14px]">자사 제품</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">제품원가</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.prodCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.prodCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_prod_cost_own' && (settlement.actual_prod_cost_own || 0) === 0 ? "" : ((settlement.actual_prod_cost_own || 0) === 0 ? "0" : (settlement.actual_prod_cost_own || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_prod_cost_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_prod_cost_own: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-bold text-[14px]">손익</td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 font-bold text-[14px] ${(baseSum.prodRevOwn - baseSum.prodCostOwn) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.prodRevOwn - baseSum.prodCostOwn).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 font-bold text-[14px] ${(latestSum.prodRevOwn - latestSum.prodCostOwn) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.prodRevOwn - latestSum.prodCostOwn).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 font-bold text-[14px] ${((settlement.actual_prod_rev_own || 0) - (settlement.actual_prod_cost_own || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_prod_rev_own || 0) - (settlement.actual_prod_cost_own || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td rowSpan={2} className="border border-gray-400 bg-white py-2 text-[14px]">타사 상품</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">상품원가</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.prodCostExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.prodCostExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_prod_cost_ext' && (settlement.actual_prod_cost_ext || 0) === 0 ? "" : ((settlement.actual_prod_cost_ext || 0) === 0 ? "0" : (settlement.actual_prod_cost_ext || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_prod_cost_ext')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_prod_cost_ext: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-bold text-[14px]">손익</td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 font-bold text-[14px] ${(baseSum.prodRevExt - baseSum.prodCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.prodRevExt - baseSum.prodCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 font-bold text-[14px] ${(latestSum.prodRevExt - latestSum.prodCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.prodRevExt - latestSum.prodCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 font-bold text-[14px] ${((settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_ext || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_ext || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-2 text-[14px]">상품 매출 손익 소계</td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${(baseSum.prodRevOwn + baseSum.prodRevExt - baseSum.prodCostOwn - baseSum.prodCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.prodRevOwn + baseSum.prodRevExt - baseSum.prodCostOwn - baseSum.prodCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${(latestSum.prodRevOwn + latestSum.prodRevExt - latestSum.prodCostOwn - latestSum.prodCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.prodRevOwn + latestSum.prodRevExt - latestSum.prodCostOwn - latestSum.prodCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold ${((settlement.actual_prod_rev_own || 0) + (settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_own || 0) - (settlement.actual_prod_cost_ext || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_prod_rev_own || 0) + (settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_own || 0) - (settlement.actual_prod_cost_ext || 0)).toLocaleString()}
                      </td>
                    </tr>

                    {/* 용역 매출 원가 섹션 */}
                    <tr>
                      <td rowSpan={7} className="border border-gray-400 bg-[#D9D9D9] font-bold py-2 text-[14px]">용역 매출 원가</td>
                      <td rowSpan={3} className="border border-gray-400 bg-white py-2 text-[14px]">자사 인력</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">M/M</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.internalMM.toFixed(3)}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.internalMM.toFixed(3)}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="number"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          step="0.01"
                          value={focusedField === 'actual_svc_mm_own' && (settlement.actual_svc_mm_own || 0) === 0 ? "" : (focusedField === 'actual_svc_mm_own' ? (settlement.actual_svc_mm_own || "") : (settlement.actual_svc_mm_own || 0).toFixed(2))}
                          onFocus={() => setFocusedField('actual_svc_mm_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setSettlement({ ...settlement, actual_svc_mm_own: Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">자사 인력 원가</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.svcCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.svcCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={focusedField === 'actual_svc_cost_own' && (settlement.actual_svc_cost_own || 0) === 0 ? "" : ((settlement.actual_svc_cost_own || 0) === 0 ? "0" : (settlement.actual_svc_cost_own || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_svc_cost_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_svc_cost_own: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">손익</td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px] ${(baseSum.svcRevOwn - baseSum.svcCostOwn) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.svcRevOwn - baseSum.svcCostOwn).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px] ${(latestSum.svcRevOwn - latestSum.svcCostOwn) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.svcRevOwn - latestSum.svcCostOwn).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 font-bold text-[14px] ${((settlement.actual_svc_rev_own || 0) - (settlement.actual_svc_cost_own || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_svc_rev_own || 0) - (settlement.actual_svc_cost_own || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td rowSpan={3} className="border border-gray-400 bg-white py-2 text-[14px]">타사 인력</td>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">M/M</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.externalMM.toFixed(3)}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.externalMM.toFixed(3)}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="number"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          step="0.01"
                          value={focusedField === 'actual_svc_mm_ext' && (settlement.actual_svc_mm_ext || 0) === 0 ? "" : (focusedField === 'actual_svc_mm_ext' ? (settlement.actual_svc_mm_ext || "") : (settlement.actual_svc_mm_ext || 0).toFixed(2))}
                          onFocus={() => setFocusedField('actual_svc_mm_ext')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setSettlement({ ...settlement, actual_svc_mm_ext: Number(e.target.value) })}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">외주 인력 원가</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{baseSum.svcCostExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.svcCostExt.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={focusedField === 'actual_svc_cost_ext' && (settlement.actual_svc_cost_ext || 0) === 0 ? "" : ((settlement.actual_svc_cost_ext || 0) === 0 ? "0" : (settlement.actual_svc_cost_ext || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_svc_cost_ext')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_svc_cost_ext: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">손익</td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px] ${(baseSum.svcRevExt - baseSum.svcCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.svcRevExt - baseSum.svcCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px] ${(latestSum.svcRevExt - latestSum.svcCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.svcRevExt - latestSum.svcCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 font-bold text-[14px] ${((settlement.actual_svc_rev_ext || 0) - (settlement.actual_svc_cost_ext || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_svc_rev_ext || 0) - (settlement.actual_svc_cost_ext || 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-2 text-[14px]">용역 매출 손익 소계</td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${(baseSum.svcRevOwn + baseSum.svcRevExt - baseSum.svcCostOwn - baseSum.svcCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.svcRevOwn + baseSum.svcRevExt - baseSum.svcCostOwn - baseSum.svcCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${(latestSum.svcRevOwn + latestSum.svcRevExt - latestSum.svcCostOwn - latestSum.svcCostExt) < 0 ? 'text-red-600' : ''}`}>
                        {(latestSum.svcRevOwn + latestSum.svcRevExt - latestSum.svcCostOwn - latestSum.svcCostExt).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold ${((settlement.actual_svc_rev_own || 0) + (settlement.actual_svc_rev_ext || 0) - (settlement.actual_svc_cost_own || 0) - (settlement.actual_svc_cost_ext || 0)) < 0 ? 'text-red-600' : ''}`}>
                        {((settlement.actual_svc_rev_own || 0) + (settlement.actual_svc_rev_ext || 0) - (settlement.actual_svc_cost_own || 0) - (settlement.actual_svc_cost_ext || 0)).toLocaleString()}
                      </td>
                    </tr>

                    {/* 프로젝트 경비 섹션 */}
                    <tr>
                      <td rowSpan={3} className="border border-gray-400 bg-[#D9D9D9] font-bold py-2 text-[14px]">프로젝트 경비</td>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">일반 경비</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{Math.round(expenseBreakdown.general).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{latestSum.expense_cost.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={focusedField === 'actual_expense_general' && (settlement.actual_expense_general || 0) === 0 ? "" : ((settlement.actual_expense_general || 0) === 0 ? "0" : (settlement.actual_expense_general || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_expense_general')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_expense_general: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 font-normal text-[14px]">특별 경비</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{Math.round(expenseBreakdown.special).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">-</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={focusedField === 'actual_expense_special' && (settlement.actual_expense_special || 0) === 0 ? "" : ((settlement.actual_expense_special || 0) === 0 ? "0" : (settlement.actual_expense_special || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_expense_special')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_expense_special: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-2 text-[14px]">경비 소계</td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">{Math.round(expenseBreakdown.general + expenseBreakdown.special).toLocaleString()}</td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">{latestSum.expense_cost.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold">{settlement.actual_other_cost.toLocaleString()}</td>
                    </tr>

                    {/* 사업 손익 섹션 */}
                    <tr>
                      <td rowSpan={3} className="border border-gray-400 bg-[#D9D9D9] font-bold py-2 text-[14px]">사업 손익</td>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">당사 제품 원가 (+)</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.baseProdCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.latestProdCostOwn.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_prod_cost_own' && (settlement.actual_prod_cost_own || 0) === 0 ? "" : (settlement.actual_prod_cost_own || 0).toLocaleString()}
                          onFocus={() => setFocusedField('actual_prod_cost_own')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_prod_cost_own: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">경상비용</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.baseBizCostIndirect.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.latestBizCostIndirect.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_biz_cost_indirect' && (settlement.actual_biz_cost_indirect || 0) === 0 ? "" : ((settlement.actual_biz_cost_indirect || 0) === 0 ? "0" : (settlement.actual_biz_cost_indirect || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_biz_cost_indirect')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_biz_cost_indirect: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-2 text-[14px]">사업 손익 합계</td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">
                        {(baseSum.profit + baseSum.prodCostOwn - extraData.baseProdCostOwn - extraData.baseBizCostIndirect).toLocaleString()}
                      </td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">
                        {(latestSum.profit + latestSum.prodCostOwn - extraData.latestProdCostOwn - extraData.latestBizCostIndirect).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold ${(((settlement.actual_prod_rev_own || 0) + (settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_own || 0) - (settlement.actual_prod_cost_ext || 0)) + ((settlement.actual_svc_rev_own || 0) + (settlement.actual_svc_rev_ext || 0)) - ((settlement.actual_svc_cost_own || 0) + (settlement.actual_svc_cost_ext || 0)) - ((settlement.actual_expense_general || 0) + (settlement.actual_expense_special || 0)) - (Number(settlement.actual_biz_cost_indirect || 0))) < 0 ? 'text-red-600' : ''}`}>
                        {(((settlement.actual_prod_rev_own || 0) + (settlement.actual_prod_rev_ext || 0) - (settlement.actual_prod_cost_own || 0) - (settlement.actual_prod_cost_ext || 0)) +
                          (((settlement.actual_svc_rev_own || 0) + (settlement.actual_svc_rev_ext || 0)) - ((settlement.actual_svc_cost_own || 0) + (settlement.actual_svc_cost_ext || 0))) -
                          ((settlement.actual_expense_general || 0) + (settlement.actual_expense_special || 0)) -
                          (Number(settlement.actual_biz_cost_indirect || 0))).toLocaleString()}
                      </td>
                    </tr>

                    {/* 부가 수익 섹션 */}
                    <tr>
                      <td rowSpan={3} className="border border-gray-400 bg-[#D9D9D9] font-bold py-2 text-[14px]">부가 수익</td>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">부가 예상 수익 (+)</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.baseExtraRevenue.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.latestExtraRevenue.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_extra_revenue' && (settlement.actual_extra_revenue || 0) === 0 ? "" : ((settlement.actual_extra_revenue || 0) === 0 ? "0" : (settlement.actual_extra_revenue || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_extra_revenue')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_extra_revenue: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-gray-400 bg-white text-left px-4 py-2 text-[14px]">부가 예상 비용 (-)</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.baseExtraExpense.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#FFFFCC] text-right px-4 py-2 text-[14px]">{extraData.latestExtraExpense.toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#EBF1DE] text-right p-0 h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          disabled={isReadOnly}
                          value={focusedField === 'actual_extra_cost' && (settlement.actual_extra_cost || 0) === 0 ? "" : ((settlement.actual_extra_cost || 0) === 0 ? "0" : (settlement.actual_extra_cost || 0).toLocaleString())}
                          onFocus={() => setFocusedField('actual_extra_cost')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/,/g, "")) || 0;
                            setSettlement({ ...settlement, actual_extra_cost: val });
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="bg-[#D9D9D9] font-bold">
                      <td colSpan={2} className="border border-gray-400 py-2 text-[14px]">부가수익 합계</td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">{(extraData.baseExtraRevenue - extraData.baseExtraExpense).toLocaleString()}</td>
                      <td className="border border-gray-400 text-right px-4 py-2 text-[14px]">{(extraData.latestExtraRevenue - extraData.latestExtraExpense).toLocaleString()}</td>
                      <td className="border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold">
                        {((settlement.actual_extra_revenue || 0) - (settlement.actual_extra_cost || 0)).toLocaleString()}
                      </td>
                    </tr>

                    {/* 최종 영업 이익 */}
                    <tr className="bg-[#D9D9D9] font-bold text-gray-900 border-t-2 border-gray-500">
                      <td colSpan={3} className="border border-gray-400 py-2 text-[14px]">프로젝트 영업 이익</td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${(baseSum.prodRevOwn + baseSum.prodRevExt + baseSum.svcRevOwn + baseSum.svcRevExt - (baseSum.prodCostOwn + baseSum.prodCostExt + baseSum.svcCostOwn + baseSum.svcCostExt + (expenseBreakdown.general + expenseBreakdown.special)) + (extraData.baseExtraRevenue - extraData.baseExtraExpense)) < 0 ? 'text-red-600' : ''}`}>
                        {(baseSum.prodRevOwn + baseSum.prodRevExt + baseSum.svcRevOwn + baseSum.svcRevExt - (baseSum.prodCostOwn + baseSum.prodCostExt + baseSum.svcCostOwn + baseSum.svcCostExt + (expenseBreakdown.general + expenseBreakdown.special)) + (extraData.baseExtraRevenue - extraData.baseExtraExpense)).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 text-right px-4 py-2 text-[14px] ${((latestPlanSummary?.profit || 0) + (extraData.latestExtraRevenue - extraData.latestExtraExpense)) < 0 ? 'text-red-600' : ''}`}>
                        {((latestPlanSummary?.profit || 0) + (extraData.latestExtraRevenue - extraData.latestExtraExpense)).toLocaleString()}
                      </td>
                      <td className={`border border-gray-400 bg-[#D9D9D9] text-right px-4 py-2 text-[14px] font-bold ${calculatedActualProfit < 0 ? 'text-red-600' : ''}`}>
                        {calculatedActualProfit.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. 수익성 요약 (기존 내용 유지) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-red-600">
              3. 제품/상품 매출 및 매입 계획
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 text-[14px]">⑴ 제품/상품 매출 및 매입 요약</p>
                <div className="text-gray-600 text-[14px]">[단위 : 천원, %]</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-[14px] text-center table-fixed">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col className="w-[120px]" />
                    <col className="w-[200px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[150px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">구분</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">업체명</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">제품/상품명</th>
                      <th colSpan={3} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">매출</th>
                      <th colSpan={3} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">매입</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">손익_실행</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">비고</th>
                    </tr>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">계획_기준 계획</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">계획_최종 변경</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">실행</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">계획_기준 계획</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">계획_최종 변경</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap">실행</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // 자사/타사 데이터 분리
                      const baseInternal = baseProductPlan.filter(item => item.type === "자사");
                      const latestInternal = latestProductPlan.filter(item => item.type === "자사");
                      const baseExternal = baseProductPlan.filter(item => item.type === "타사");
                      const latestExternal = latestProductPlan.filter(item => item.type === "타사");

                      // 최소 5개 행 보장
                      const internalRowCount = Math.max(5, baseInternal.length, latestInternal.length);
                      const externalRowCount = Math.max(5, baseExternal.length, latestExternal.length);

                      // 합계 계산 함수
                      const calcTotal = (items: ProductPlanItem[], field: 'proposalPrice' | 'costPrice') => {
                        return items.reduce((sum, item) => sum + (item[field] || 0), 0);
                      };

                      const baseInternalSalesTotal = calcTotal(baseInternal, 'proposalPrice');
                      const latestInternalSalesTotal = calcTotal(latestInternal, 'proposalPrice');
                      const baseInternalCostTotal = calcTotal(baseInternal, 'costPrice');
                      const latestInternalCostTotal = calcTotal(latestInternal, 'costPrice');

                      const baseExternalSalesTotal = calcTotal(baseExternal, 'proposalPrice');
                      const latestExternalSalesTotal = calcTotal(latestExternal, 'proposalPrice');
                      const baseExternalCostTotal = calcTotal(baseExternal, 'costPrice');
                      const latestExternalCostTotal = calcTotal(latestExternal, 'costPrice');

                      return (
                        <>
                          {/* 자사 섹션 */}
                          {[...Array(internalRowCount)].map((_, i) => {
                            const baseItem = baseInternal[i];
                            const latestItem = latestInternal[i];

                            return (
                              <tr key={`internal-${i}`} className="h-[35px]">
                                {i === 0 && (
                                  <td rowSpan={internalRowCount + 1} className="border border-gray-300 bg-gray-50 font-bold py-[4px] text-sm">자사</td>
                                )}
                                <td className="border border-gray-300 bg-white py-[4px] text-left px-[10px] text-sm">
                                  {baseItem?.companyName || latestItem?.companyName || '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-white py-[4px] text-left px-[10px] text-sm">
                                  {baseItem?.productName || latestItem?.productName || '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {baseItem?.proposalPrice ? baseItem.proposalPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {latestItem?.proposalPrice ? latestItem.proposalPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                    value={baseItem?.actualProposalPrice ? baseItem.actualProposalPrice.toLocaleString() : ''}
                                    onChange={(e) => handleProductActualChange(i, 'internal', 'actualProposalPrice', e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {baseItem?.costPrice ? baseItem.costPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {latestItem?.costPrice ? latestItem.costPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                    value={baseItem?.actualCostPrice ? baseItem.actualCostPrice.toLocaleString() : ''}
                                    onChange={(e) => handleProductActualChange(i, 'internal', 'actualCostPrice', e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm">
                                  {((baseItem?.actualProposalPrice || 0) - (baseItem?.actualCostPrice || 0)).toLocaleString()}
                                </td>
                                <td className="border border-gray-300 bg-white py-[4px] text-sm">&nbsp;</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gray-50 font-bold h-[35px]">
                            <td colSpan={2} className="border border-gray-300 py-[4px] text-left px-[10px] text-sm">자사 합계</td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {baseInternalSalesTotal > 0 ? baseInternalSalesTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {latestInternalSalesTotal > 0 ? latestInternalSalesTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {baseInternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {baseInternalCostTotal > 0 ? baseInternalCostTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {latestInternalCostTotal > 0 ? latestInternalCostTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {baseInternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {(baseInternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0) - baseInternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0)).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-sm">&nbsp;</td>
                          </tr>

                          {/* 타사 섹션 */}
                          {[...Array(externalRowCount)].map((_, i) => {
                            const baseItem = baseExternal[i];
                            const latestItem = latestExternal[i];

                            return (
                              <tr key={`external-${i}`} className="h-[35px]">
                                {i === 0 && (
                                  <td rowSpan={externalRowCount + 1} className="border border-gray-300 bg-gray-50 font-bold py-[4px] text-sm">타사</td>
                                )}
                                <td className="border border-gray-300 bg-white py-[4px] text-left px-[10px] text-sm">
                                  {baseItem?.companyName || latestItem?.companyName || '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-white py-[4px] text-left px-[10px] text-sm">
                                  {baseItem?.productName || latestItem?.productName || '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {baseItem?.proposalPrice ? baseItem.proposalPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {latestItem?.proposalPrice ? latestItem.proposalPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                    value={baseItem?.actualProposalPrice ? baseItem.actualProposalPrice.toLocaleString() : ''}
                                    onChange={(e) => handleProductActualChange(i, 'external', 'actualProposalPrice', e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {baseItem?.costPrice ? baseItem.costPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] text-right px-[10px] text-sm">
                                  {latestItem?.costPrice ? latestItem.costPrice.toLocaleString() : '\u00a0'}
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                    value={baseItem?.actualCostPrice ? baseItem.actualCostPrice.toLocaleString() : ''}
                                    onChange={(e) => handleProductActualChange(i, 'external', 'actualCostPrice', e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm">
                                  {((baseItem?.actualProposalPrice || 0) - (baseItem?.actualCostPrice || 0)).toLocaleString()}
                                </td>
                                <td className="border border-gray-300 bg-white py-[4px] text-sm">&nbsp;</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gray-50 font-bold h-[35px]">
                            <td colSpan={2} className="border border-gray-300 py-[4px] text-left px-[10px] text-sm">타사 합계</td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {baseExternalSalesTotal > 0 ? baseExternalSalesTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {latestExternalSalesTotal > 0 ? latestExternalSalesTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {baseExternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {baseExternalCostTotal > 0 ? baseExternalCostTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {latestExternalCostTotal > 0 ? latestExternalCostTotal.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {baseExternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {(baseExternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0) - baseExternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0)).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-sm">&nbsp;</td>

                          </tr>

                          {/* 합계 행 */}
                          <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-500 h-[35px]">
                            <td colSpan={3} className="border border-gray-300 py-[4px] text-left px-[10px] text-sm">제품/상품 합계</td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {(baseInternalSalesTotal + baseExternalSalesTotal) > 0 ? (baseInternalSalesTotal + baseExternalSalesTotal).toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {(latestInternalSalesTotal + latestExternalSalesTotal) > 0 ? (latestInternalSalesTotal + latestExternalSalesTotal).toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {(baseInternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0) + baseExternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0)).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {(baseInternalCostTotal + baseExternalCostTotal) > 0 ? (baseInternalCostTotal + baseExternalCostTotal).toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-right px-[10px] text-sm">
                              {(latestInternalCostTotal + latestExternalCostTotal) > 0 ? (latestInternalCostTotal + latestExternalCostTotal).toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {(baseInternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0) + baseExternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0)).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] text-right px-[10px] text-sm font-bold">
                              {((baseInternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0) + baseExternal.reduce((sum, item) => sum + (item.actualProposalPrice || 0), 0)) - (baseInternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0) + baseExternal.reduce((sum, item) => sum + (item.actualCostPrice || 0), 0))).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 py-[4px] text-sm">&nbsp;</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          {/* 4. 내부/외부 인력 투입 계획 */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-red-600">
              4. 내부/외부 인력 투입 계획
            </h2>

            {/* ⑴ 내부/외부 인력 투입 계획 (월별 세부) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 text-[14px]">⑴ 내부/외부 인력 투입 계획 (월별 세부)</p>

                  {/* 월(전) 컨트롤 */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={addMonthAtStart}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> 월(전)
                    </button>
                    {monthColumns.length > 0 && (
                      <button
                        onClick={deleteMonthAtStart}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 월(전)
                      </button>
                    )}
                  </div>

                  {/* 구분선 */}
                  <div className="w-px h-7 bg-gray-300 mx-0.5" />

                  {/* 월(후) 컨트롤 */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={addMonthAtEnd}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> 월(후)
                    </button>
                    {monthColumns.length > 0 && (
                      <button
                        onClick={deleteMonthAtEnd}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 월(후)
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-600 text-[14px] whitespace-nowrap ml-auto">[단위 : M/M, 천원]</div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-gray-400 text-[14px] text-center">
                  <thead>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">구분</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[100px] min-w-[100px]">업체명</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[120px] min-w-[120px]">역할Ⅰ</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[240px] min-w-[240px]">역할Ⅱ</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[100px] min-w-[100px]">소속 및 직군</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[70px] min-w-[70px]">등급</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[70px] min-w-[70px]">직급</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[100px] min-w-[100px]">성함</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">
                        <div>계획_기준</div>
                        <div>/</div>
                        <div>실행</div>
                      </th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[70px] min-w-[70px]">투입</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[70px] min-w-[70px]">합계</th>
                      {(() => {
                        // 연도별로 월을 그룹화
                        const yearGroups: { [key: string]: string[] } = {};
                        monthColumns.forEach((month) => {
                          const year = month.split('-')[0];
                          if (!yearGroups[year]) {
                            yearGroups[year] = [];
                          }
                          yearGroups[year].push(month);
                        });

                        return Object.entries(yearGroups).map(([year, months]) => (
                          <th key={year} colSpan={months.length} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">
                            {year}년
                          </th>
                        ));
                      })()}
                      <th colSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">투입금액</th>
                    </tr>
                    <tr className="bg-blue-50/50 h-[35px]">
                      {monthColumns.map((month, index) => {
                        const monthNum = parseInt(month.split('-')[1]);
                        return (
                          <th key={month} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[60px] min-w-[60px]">
                            <div>{monthNum}월</div>
                            <div className="text-[11px] font-normal">M{index + 1}</div>
                          </th>
                        );
                      })}
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">투입</th>
                      <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[100px] min-w-[100px]">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseManpowerPlan.map((item, index) => {
                      const totalMM = Object.values(item.monthlyAllocation || {}).reduce((sum, val) => sum + val, 0);
                      const actualTotalMM = Object.values(item.actualMonthlyAllocation || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
                      const totalAmount = item.internalAmount || 0;

                      return (
                        <React.Fragment key={`manpower-${index}`}>
                          {/* 계획 행 */}
                          <tr className="h-[35px]">
                            <td rowSpan={2} className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <select
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-center px-[10px] appearance-none hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.affiliationGroup?.startsWith('외주') ? '외부' : '내부'}
                                onChange={(e) => {
                                  const isExternal = e.target.value === '외부';
                                  const newAffiliation = isExternal ? '외주_개발' : '위엠비_개발';
                                  handleManpowerChange(item.id || 0, 'affiliationGroup', newAffiliation);
                                }}
                              >
                                <option value="내부">내부</option>
                                <option value="외부">외부</option>
                              </select>
                            </td>

                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <input
                                type="text"
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-left px-[10px] hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.companyName || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'companyName', e.target.value)}
                                placeholder=""
                              />
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <input
                                type="text"
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-left px-[10px] hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.role || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'role', e.target.value)}
                                placeholder=""
                              />
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <input
                                type="text"
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-left px-[10px] hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.detailedTask || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'detailedTask', e.target.value)}
                                placeholder=""
                              />
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <select
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-center px-[10px] appearance-none hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.affiliationGroup || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'affiliationGroup', e.target.value)}
                              >
                                <option value="">선택</option>
                                {distinctAffiliationGroups.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <select
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-center px-[10px] appearance-none hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.grade || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'grade', e.target.value)}
                              >
                                <option value="">선택</option>
                                {distinctGrades.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <select
                                className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-center px-[10px] appearance-none hover:bg-blue-50/50 transition-colors rounded-none"
                                value={item.wmbRank || ''}
                                onChange={(e) => handleManpowerChange(item.id || 0, 'wmbRank', e.target.value)}
                              >
                                <option value="">선택</option>
                                {distinctJobLevels.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                              <div className="flex items-center gap-1 h-full hover:bg-blue-50/50 transition-colors px-1">
                                <div className="relative flex-1 h-full">
                                  <input
                                    type="text"
                                    list={`users-list-${item.id}`}
                                    className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm text-center px-[4px] rounded-none focus:bg-white"
                                    value={item.name || ''}
                                    onChange={(e) => handleManpowerChange(item.id || 0, 'name', e.target.value)}
                                    placeholder=""
                                  />
                                  <datalist id={`users-list-${item.id}`}>
                                    {users.map(u => (
                                      <option key={u.id} value={u.name}>{u.departmentName} | {u.rankName}</option>
                                    ))}
                                  </datalist>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteManpowerRow(item.id || 0)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-gray-100"
                                  title="삭제"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-sm font-medium">
                              계획
                            </td>
                            <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm font-medium">
                              {(totalMM || 0).toFixed(3)}
                            </td>
                            <td className="border border-gray-300 bg-gray-400 py-[4px] px-[10px] text-right text-sm font-medium">
                              &nbsp;
                            </td>
                            {monthColumns.map((month) => (
                              <td key={`plan-${month}`} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">
                                {(item.monthlyAllocation?.[month] || 0).toFixed(3)}
                              </td>
                            ))}
                            <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm font-medium">
                              {item.internalAmount ? item.internalAmount.toLocaleString() : '\u00a0'}
                            </td>
                            <td className="border border-gray-300 bg-gray-400 py-[4px] px-[10px] text-right text-sm font-medium">
                              &nbsp;
                            </td>
                          </tr>
                          {/* 실행 행 */}
                          <tr className="h-[35px]">

                            <td colSpan={8} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-sm font-medium text-left">
                              <span className="inline-flex items-center justify-center w-6 h-4 bg-white/50 rounded-sm text-[10px] text-gray-500 mr-2 border border-black/5 shadow-sm">#{index + 1}</span>
                              <span className="text-gray-700">실행 내역</span>
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm font-medium">
                              {(actualTotalMM || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm font-medium">
                              {(actualTotalMM || 0).toFixed(2)}
                            </td>
                            {monthColumns.map((month) => (
                              <td key={`exec-${month}`} className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                  placeholder="0"
                                  value={item.actualMonthlyAllocation?.[month] == null ? '' : item.actualMonthlyAllocation[month]}
                                  onChange={(e) => handleActualAllocationChange(item.id || 0, month, e.target.value)}
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 bg-[#EBF1DE] p-0 text-right text-sm h-[35px] font-medium">
                              <input
                                type="text"
                                className="w-full h-full text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                value={item.actualInternalAmount != null
                                  ? item.actualInternalAmount.toLocaleString()
                                  : (Number(actualTotalMM) > 0 ? Math.round((item.internalUnitPrice || 0) * Number(actualTotalMM)).toLocaleString() : '')}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                  handleManpowerChange(item.id || 0, 'actualInternalAmount', val);
                                }}
                                placeholder="0"
                              />
                            </td>
                            <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm font-medium">
                              {item.actualInternalAmount != null
                                ? item.actualInternalAmount.toLocaleString()
                                : (Number(actualTotalMM) > 0 ? Math.round((item.internalUnitPrice || 0) * Number(actualTotalMM)).toLocaleString() : '\u00a0')}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* 요약 행 (내부, 외부, 전체) */}
                    {manpowerSummaries.map((summary, sIdx) => (
                      <React.Fragment key={`summary-${sIdx}`}>
                        {/* 계획 행 */}
                        <tr className="bg-gray-100 font-bold h-[35px]">
                          <td rowSpan={2} colSpan={8} className="border border-gray-300 py-[4px] px-[10px] text-center text-sm">
                            {summary.label}
                          </td>
                          <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-center text-sm font-bold">
                            계획
                          </td>
                          <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">
                            {(summary.totalPlanMM || 0).toFixed(3)}
                          </td>
                          <td className="border border-gray-300 bg-gray-400 py-[4px] px-[10px] text-right text-sm">
                            &nbsp;
                          </td>
                          {summary.planMonthly.map((val, mIdx) => (
                            <td key={`plan-sum-${mIdx}`} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">
                              {(val || 0).toFixed(2)}
                            </td>
                          ))}
                          <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">
                            {summary.totalPlanAmount > 0 ? summary.totalPlanAmount.toLocaleString() : '-'}
                          </td>
                          <td className="border border-gray-300 bg-gray-400 py-[4px] px-[10px] text-right text-sm">
                            &nbsp;
                          </td>
                        </tr>
                        {/* 실행 행 */}
                        <tr className="bg-gray-100 font-bold h-[35px]">
                          <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-center text-sm font-bold">
                            실행
                          </td>
                          <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm">
                            {(summary.totalActualMM || 0).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm">
                            {(summary.totalActualMM || 0).toFixed(2)}
                          </td>
                          {summary.actualMonthly.map((val, mIdx) => (
                            <td key={`actual-sum-${mIdx}`} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm">
                              {(val || 0).toFixed(2)}
                            </td>
                          ))}
                          <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm">
                            {summary.totalActualAmount > 0 ? summary.totalActualAmount.toLocaleString() : '-'}
                          </td>
                          <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right text-sm">
                            {summary.totalActualAmount > 0 ? summary.totalActualAmount.toLocaleString() : '-'}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                  {/* 행 추가 버튼 */}
                  <tfoot>
                    <tr>
                      <td colSpan={8} className="border border-gray-400 p-0 h-[35px]">
                        <button
                          type="button"
                          onClick={addManpowerRow}
                          className="flex items-center justify-center gap-1.5 w-full h-full rounded-none bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          인력 추가
                        </button>
                      </td>
                      <td colSpan={5 + monthColumns.length} className="border border-gray-400 bg-white"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ⑵ 외주 업체별 계획 (월별 세부) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 text-[14px]">⑵ 외주 업체별 계획 (월별 세부)</p>
                <div className="text-gray-600 text-[14px]">[단위 : M/M, 천원]</div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-gray-400 text-sm text-center w-full">
                  <thead>
                    <tr className="bg-blue-50/50 h-[35px]">
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[180px] min-w-[180px]">업체명</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[120px] min-w-[120px]">역할Ⅰ</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[240px] min-w-[240px]">역할Ⅱ</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">계획/실행</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">M/M / 금액</th>
                      <th rowSpan={2} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[100px] min-w-[100px]">합계</th>
                      {(() => {
                        const yearGroups: { [key: string]: string[] } = {};
                        monthColumns.forEach((month) => {
                          const year = month.split('-')[0];
                          if (!yearGroups[year]) yearGroups[year] = [];
                          yearGroups[year].push(month);
                        });
                        return Object.entries(yearGroups).map(([year, months]) => (
                          <th key={`ext-year-${year}`} colSpan={months.length} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">
                            {year}년
                          </th>
                        ));
                      })()}
                    </tr>
                    <tr className="bg-blue-50/50 h-[35px]">
                      {monthColumns.map((month, index) => {
                        const monthNum = parseInt(month.split('-')[1]);
                        return (
                          <th key={`ext-month-${month}`} className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm whitespace-nowrap w-[80px] min-w-[80px]">
                            <div>{monthNum}월</div>
                            <div className="text-[11px] font-normal">M{index + 1}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {extCompanyPlans.length === 0 ? (
                      <tr>
                        <td colSpan={6 + monthColumns.length} className="border border-gray-400 py-8 text-gray-400">데이터가 없습니다. 아래 버튼을 눌러 업체를 추가해주세요.</td>
                      </tr>
                    ) : (
                      <>
                        {extCompanyPlans.map((item, index) => {
                          const calcTotal = (map: Record<string, string | number>): number =>
                            Object.values(map).reduce<number>((sum, val) => sum + (parseFloat(String(val).replace(/,/g, '')) || 0), 0);

                          const totalPlanMM = calcTotal(item.planMM);
                          const totalPlanAmt = calcTotal(item.planAmt);
                          const totalExecMM = calcTotal(item.execMM);
                          const totalExecAmt = calcTotal(item.execAmt);

                          return (
                            <React.Fragment key={`ext-company-${item.id}`}>
                              {/* 1. 계획 - M/M */}
                              <tr className="h-[35px]">
                                <td rowSpan={4} className="border border-gray-300 bg-white p-0 text-sm h-[35px]">
                                  <div className="flex items-center gap-1 h-full hover:bg-blue-50/50 transition-colors">
                                    <input
                                      type="text"
                                      className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm px-[10px] rounded-none focus:bg-white"
                                      value={item.companyName}
                                      onChange={(e) => handleExtCompanyChange(item.id, 'companyName', e.target.value)}
                                      placeholder="업체명"
                                    />
                                    <button onClick={() => deleteExtCompanyRow(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </td>
                                <td rowSpan={4} className="border border-gray-300 bg-white p-0 h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none"
                                    value={item.role1}
                                    onChange={(e) => handleExtCompanyChange(item.id, 'role1', e.target.value)}
                                    placeholder="역할Ⅰ"
                                  />
                                </td>
                                <td rowSpan={4} className="border border-gray-300 bg-white p-0 h-[35px]">
                                  <input
                                    type="text"
                                    className="w-full h-full block border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none"
                                    value={item.role2}
                                    onChange={(e) => handleExtCompanyChange(item.id, 'role2', e.target.value)}
                                    placeholder="역할Ⅱ"
                                  />
                                </td>
                                <td rowSpan={2} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] font-medium text-sm">계획</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] font-medium text-sm">M/M</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right font-medium text-sm">{totalPlanMM > 0 ? totalPlanMM.toFixed(2) : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-plan-mm-${item.id}-${month}`} className="border border-gray-300 bg-[#FFFFCC] p-0 h-[35px]">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                      value={item.planMM[month] && Number(item.planMM[month]) !== 0 ? item.planMM[month] : ''}
                                      onChange={(e) => handleExtValueChange(item.id, 'planMM', month, e.target.value)}
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                              {/* 2. 계획 - 금액 */}
                              <tr className="h-[35px]">
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] font-medium text-sm">금액</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right font-medium text-sm">{totalPlanAmt > 0 ? Math.round(totalPlanAmt / 1000).toLocaleString() : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-plan-amt-${item.id}-${month}`} className="border border-gray-300 bg-[#FFFFCC] p-0 h-[35px]">
                                    <input
                                      type="text"
                                      className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                      value={item.planAmt[month] && parseInt(item.planAmt[month].replace(/,/g, '')) !== 0 ? parseInt(item.planAmt[month].replace(/,/g, '')).toLocaleString() : ''}
                                      onChange={(e) => handleExtValueChange(item.id, 'planAmt', month, e.target.value.replace(/,/g, ''))}
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                              {/* 3. 실행 - M/M */}
                              <tr className="h-[35px]">
                                <td rowSpan={2} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] font-medium text-sm">실행</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] font-medium text-sm">M/M</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right font-medium text-sm">{totalExecMM > 0 ? totalExecMM.toFixed(2) : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-exec-mm-${item.id}-${month}`} className="border border-gray-300 bg-[#EBF1DE] p-0 h-[35px]">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                      value={item.execMM[month] && Number(item.execMM[month]) !== 0 ? item.execMM[month] : ''}
                                      onChange={(e) => handleExtValueChange(item.id, 'execMM', month, e.target.value)}
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                              {/* 4. 실행 - 금액 */}
                              <tr className="h-[35px]">
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] font-medium text-sm">금액</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right font-medium text-sm">{totalExecAmt > 0 ? Math.round(totalExecAmt / 1000).toLocaleString() : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-exec-amt-${item.id}-${month}`} className="border border-gray-300 bg-[#EBF1DE] p-0 h-[35px]">
                                    <input
                                      type="text"
                                      className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                                      value={item.execAmt[month] && parseInt(item.execAmt[month].replace(/,/g, '')) !== 0 ? parseInt(item.execAmt[month].replace(/,/g, '')).toLocaleString() : ''}
                                      onChange={(e) => handleExtValueChange(item.id, 'execAmt', month, e.target.value.replace(/,/g, ''))}
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                            </React.Fragment>
                          );
                        })}

                        {/* 합계 행 */}
                        {(() => {
                          const calcTotalByMonth = (field: 'planMM' | 'planAmt' | 'execMM' | 'execAmt', month: string) =>
                            extCompanyPlans.reduce((sum, item) => sum + (parseFloat((item[field][month] || '0').toString().replace(/,/g, '')) || 0), 0);

                          const totalPlanMM = extCompanyPlans.reduce((sum, item) => {
                            return sum + Object.values(item.planMM).reduce((subSum, val) => subSum + (parseFloat(String(val).replace(/,/g, '')) || 0), 0);
                          }, 0);
                          const totalPlanAmt = extCompanyPlans.reduce((sum, item) => {
                            return sum + Object.values(item.planAmt).reduce((subSum, val) => subSum + (parseFloat(String(val).replace(/,/g, '')) || 0), 0);
                          }, 0);
                          const totalExecMM = extCompanyPlans.reduce((sum, item) => {
                            return sum + Object.values(item.execMM).reduce((subSum, val) => subSum + (parseFloat(String(val).replace(/,/g, '')) || 0), 0);
                          }, 0);
                          const totalExecAmt = extCompanyPlans.reduce((sum, item) => {
                            return sum + Object.values(item.execAmt).reduce((subSum, val) => subSum + (parseFloat(String(val).replace(/,/g, '')) || 0), 0);
                          }, 0);

                          return (
                            <React.Fragment key="ext-total-summary">
                              <tr className="bg-gray-100 font-bold h-[35px]">
                                <td rowSpan={4} colSpan={3} className="border border-gray-300 py-[4px] px-[10px] text-sm text-center">합계</td>
                                <td rowSpan={2} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-sm text-center">계획</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-sm text-center">M/M</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">{totalPlanMM > 0 ? totalPlanMM.toFixed(2) : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-sum-plan-mm-${month}`} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right text-sm">
                                    {(() => {
                                      const val = calcTotalByMonth('planMM', month);
                                      return val > 0 ? val.toFixed(2) : '';
                                    })()}
                                  </td>
                                ))}
                              </tr>
                              <tr className="bg-gray-100 font-bold h-[35px] text-sm">
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-center">금액</td>
                                <td className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right">{totalPlanAmt > 0 ? Math.round(totalPlanAmt / 1000).toLocaleString() : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-sum-plan-amt-${month}`} className="border border-gray-300 bg-[#FFFFCC] py-[4px] px-[10px] text-right">
                                    {(() => {
                                      const val = calcTotalByMonth('planAmt', month);
                                      return val > 0 ? Math.round(val / 1000).toLocaleString() : '';
                                    })()}
                                  </td>
                                ))}
                              </tr>
                              <tr className="bg-gray-100 font-bold h-[35px] text-sm">
                                <td rowSpan={2} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-center">실행</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-center">M/M</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right">{totalExecMM > 0 ? totalExecMM.toFixed(2) : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-sum-exec-mm-${month}`} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right">
                                    {(() => {
                                      const val = calcTotalByMonth('execMM', month);
                                      return val > 0 ? val.toFixed(2) : '';
                                    })()}
                                  </td>
                                ))}
                              </tr>
                              <tr className="bg-gray-100 font-bold h-[35px] text-sm">
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-center">금액</td>
                                <td className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right">{totalExecAmt > 0 ? Math.round(totalExecAmt / 1000).toLocaleString() : ''}</td>
                                {monthColumns.map((month) => (
                                  <td key={`ext-sum-exec-amt-${month}`} className="border border-gray-300 bg-[#EBF1DE] py-[4px] px-[10px] text-right">
                                    {(() => {
                                      const val = calcTotalByMonth('execAmt', month);
                                      return val > 0 ? Math.round(val / 1000).toLocaleString() : '';
                                    })()}
                                  </td>
                                ))}
                              </tr>
                            </React.Fragment>
                          );
                        })()}
                      </>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="border border-gray-400 p-0 h-[35px]">
                        <button
                          onClick={addExtCompanyRow}
                          className="flex items-center justify-center gap-1.5 w-full h-full rounded-none bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-3 w-3" /> 업체 추가
                        </button>
                      </td>
                      <td colSpan={3 + monthColumns.length} className="border border-gray-400 bg-white"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* 5. 비용 계획 및 실행 */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-red-600">5. 비용 계획 및 실행</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-[14px] text-center table-fixed">
                <colgroup>
                  <col className="w-[100px]" />
                  <col className="w-[180px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[50px]" />
                  <col className="w-[100px]" />
                  <col className="w-[100px]" />
                  <col className="w-[50px]" />
                </colgroup>
                <thead>
                  <tr className="bg-blue-50/50 h-[35px]">
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">구분</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">계정</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">계획_기준 계획</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">계획_최종 변경</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm border-x-2 border-x-gray-500">실행 합계</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm"></th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">판관</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm">원가</th>
                    <th className="border border-gray-300 py-[4px] px-[10px] font-bold text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseDetails.map((item, index) => (
                    <tr key={index} className="h-[35px]">
                      {index === 0 && (
                        <td rowSpan={EXPENSE_ITEMS.length} className="border border-gray-300 bg-white py-[4px] px-[10px] text-sm align-middle font-bold">전체</td>
                      )}
                      <td className="border border-gray-300 py-[4px] px-[10px] text-left bg-white font-medium text-sm">{item.item}</td>
                      <td className="border border-gray-300 p-0 bg-[#FFFFCC] text-right text-sm h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                          value={item.planStandard === 0 ? '' : item.planStandard.toLocaleString()}
                          onChange={(e) => handleExpenseChange(index, 'planStandard', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-0 bg-[#FFFFCC] text-right text-sm h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-blue-50/50 transition-colors rounded-none focus:bg-white"
                          value={item.planLatest === 0 ? '' : item.planLatest.toLocaleString()}
                          onChange={(e) => handleExpenseChange(index, 'planLatest', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-0 bg-[#EBF1DE] text-right border-x-2 border-x-gray-500 text-sm h-[35px] font-bold">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-0 bg-transparent text-sm p-0 px-[10px] rounded-none cursor-default"
                          value={item.execTotal === 0 ? '' : item.execTotal.toLocaleString()}
                          readOnly
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 bg-white text-sm"></td>
                      <td className="border border-gray-300 p-0 bg-[#EBF1DE] text-right text-sm h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={item.sellAdmin === 0 ? '' : item.sellAdmin.toLocaleString()}
                          onChange={(e) => handleExpenseChange(index, 'sellAdmin', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-0 bg-[#EBF1DE] text-right text-sm h-[35px]">
                        <input
                          type="text"
                          className="w-full h-full block text-right border-0 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-sm p-0 px-[10px] hover:bg-black/5 transition-colors rounded-none focus:bg-white"
                          value={item.cost === 0 ? '' : item.cost.toLocaleString()}
                          onChange={(e) => handleExpenseChange(index, 'cost', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 bg-white text-sm"></td>
                    </tr>
                  ))}
                  {(() => {
                    const totalExec = expenseDetails.reduce((sum, item) => sum + item.execTotal, 0);
                    const totalSellAdmin = expenseDetails.reduce((sum, item) => sum + item.sellAdmin, 0);
                    const totalCost = expenseDetails.reduce((sum, item) => sum + item.cost, 0);

                    return (
                      <tr className="bg-gray-50 font-bold h-[35px]">
                        <td colSpan={2} className="border border-gray-300 py-[4px] px-[10px] text-center text-sm">전체 비용 합계</td>
                        <td className="border border-gray-300 py-[4px] px-[10px] text-right text-sm">
                          {(Math.round(expenseBreakdown.general + expenseBreakdown.special)).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 py-[4px] px-[10px] text-right text-sm">
                          {latestSum.expense_cost.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 py-[4px] px-[10px] text-right bg-[#EBF1DE] border-x-2 border-x-gray-500 text-sm font-bold">
                          {Math.round(settlement.actual_other_cost || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 bg-white text-sm"></td>
                        <td className="border border-gray-300 py-[4px] px-[10px] text-right bg-[#EBF1DE] text-sm font-bold">
                          {totalSellAdmin.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 py-[4px] px-[10px] text-right bg-[#EBF1DE] text-sm font-bold">
                          {totalCost.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 bg-white text-sm"></td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
