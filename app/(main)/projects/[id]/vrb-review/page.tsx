"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, List, Plus, Copy, Save, CheckCircle2, XCircle, Trash2, AlertCircle, HelpCircle, Calendar as CalendarIcon, FileSpreadsheet, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";
import { DatePicker, Dropdown, Button, Input, Select, Badge, Textarea, StatusBadge, useToast } from "@/components/ui";
import type { AlertType } from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import { cn } from "@/lib/utils";

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
  code?: string;
}

interface VrbData {
  // 프로젝트 개요
  customerName: string;
  projectBudget: string;
  winProbability: string;
  winDate: string;
  businessType: string;
  partners: string;
  competitors: string;
  customerInfo: string;
  salesManager: string;
  psManager: string;
  expectedStartDate: string;
  expectedEndDate: string;
  mainContractor: string;
  partnerInfo: string;
  keySolutions: string;

  // 사업배경
  businessBackground: string;

  // 사업범위
  businessScope: string;

  // 주요내용
  keyContents: Array<{
    date: string;
    content: string;
    ui_height?: number;
  }>;

  // 주요활동
  keyActivities: Array<{
    date: string;
    activity: string;
    attendees: string;
    ui_height?: number;
  }>;

  // 리스크
  risk: string;

  // 사전 수지분석서 요약 (Worst)
  worstCase: {
    estimatedRevenueGoods: number;
    estimatedRevenueServices: number;
    estimatedRevenueHw: number;
    estimatedMm: number;
    estimatedMmItems: Array<{
      item: string;
      mm: number;
    }>;
    projectCosts: Array<{
      item: string;
      amount: number;
    }>;
    otherGoodsItems: Array<{
      item: string;
      amount: number;
    }>;
    existingSystemLinkage: number;
    riskCostPercent: number;
    riskCostBase: string;
    externalPurchasePercent: number;
    externalPurchaseBase: string;
    externalPurchase2Percent: number;
    externalPurchase2Base: string;
    includeExternalPurchase: boolean;
    includeExternalPurchase2: boolean;
    operatingProfit1: number;
    operatingProfit1Percent: number;
    operatingProfitEP1: number;
    operatingProfitEP1Percent: number;
    operatingProfitEP2: number;
    operatingProfitEP2Percent: number;
  };

  // 사전 수지분석서 요약 (Best)
  bestCase: {
    estimatedRevenueGoods: number;
    estimatedRevenueServices: number;
    estimatedRevenueHw: number;
    estimatedMm: number;
    estimatedMmItems: Array<{
      item: string;
      mm: number;
    }>;
    projectCosts: Array<{
      item: string;
      amount: number;
    }>;
    otherGoodsItems: Array<{
      item: string;
      amount: number;
    }>;
    existingSystemLinkage: number;
    riskCostPercent: number;
    riskCostBase: string;
    externalPurchasePercent: number;
    externalPurchaseBase: string;
    externalPurchase2Percent: number;
    externalPurchase2Base: string;
    includeExternalPurchase: boolean;
    includeExternalPurchase2: boolean;
    operatingProfit1: number;
    operatingProfit1Percent: number;
    operatingProfitEP1: number;
    operatingProfitEP1Percent: number;
    operatingProfitEP2: number;
    operatingProfitEP2Percent: number;
  };

  // 사업 진행근거 및 기대효과
  businessBasis: string;
  reviewResult?: string; // 진행(PROCEED), 미진행(STOP)
  uiSettings?: {
    heights?: {
      businessBackground?: number;
      businessScope?: number;
      risk?: number;
      businessBasis?: number;
    }
  };
}

export default function VrbReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVrbId, setCurrentVrbId] = useState<number | null>(null);
  const [isNewVrb, setIsNewVrb] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vrbStatus, setVrbStatus] = useState<string>("STANDBY");
  const [rejectionReason, setRejectionReason] = useState<string>("");

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

  // 완료 상태일 때는 수정 불가
  const isReadOnly = vrbStatus === 'COMPLETED';

  // 기준정보 데이터
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // 검색 및 드롭다운 상태
  const [customerSearch, setCustomerSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [psSearch, setPsSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showPsDropdown, setShowPsDropdown] = useState(false);



  // 예상 M/M 입력 중간 상태 (입력 중에는 원본 문자열 유지)
  const [mmInputValues, setMmInputValues] = useState<{
    [key: string]: string;
  }>({});

  // 숫자 입력 필드 중간 상태 (천단위 구분 기호 포함)
  const [numberInputValues, setNumberInputValues] = useState<{
    [key: string]: string;
  }>({});

  // 천단위 구분 기호 추가 헬퍼 함수
  const formatNumberWithCommas = (value: number | string): string => {
    if (value === "" || value === null || value === undefined) return "";
    const numValue = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(numValue)) return "";
    return numValue.toLocaleString("ko-KR");
  };

  // 콤마 제거하고 숫자로 변환
  const parseNumberFromString = (value: string): number => {
    if (!value || value === "") return 0;
    const cleaned = value.replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // 입력값에 천단위 구분 기호 자동 추가
  const addCommasToNumber = (value: string): string => {
    if (value === "" || value === null || value === undefined) return "";
    // 콤마 제거
    const cleaned = value.replace(/,/g, "");
    // 숫자만 남기기
    const numbersOnly = cleaned.replace(/[^0-9]/g, "");
    if (numbersOnly === "") return "";
    // 천단위 구분 기호 추가
    return parseFloat(numbersOnly).toLocaleString("ko-KR");
  };
  const [vrbData, setVrbData] = useState<VrbData>({
    customerName: "",
    projectBudget: "",
    winProbability: "",
    winDate: "",
    businessType: "",
    partners: "",
    competitors: "",
    customerInfo: "",
    salesManager: "",
    psManager: "",
    expectedStartDate: "",
    expectedEndDate: "",
    mainContractor: "",
    partnerInfo: "",
    keySolutions: "",
    businessBackground: "",
    businessScope: "",
    keyContents: [],
    keyActivities: [],
    risk: "",
    worstCase: {
      estimatedRevenueGoods: 0,
      estimatedRevenueServices: 0,
      estimatedRevenueHw: 0,
      estimatedMm: 0,
      estimatedMmItems: [],
      projectCosts: [{ item: "", amount: 0 }],
      otherGoodsItems: [],
      existingSystemLinkage: 0,
      riskCostPercent: 10,
      riskCostBase: "total_revenue",
      externalPurchasePercent: 0,
      externalPurchaseBase: "operating_profit",
      externalPurchase2Percent: 0,
      externalPurchase2Base: "operating_profit",
      includeExternalPurchase: false,
      includeExternalPurchase2: false,
      operatingProfit1: 0,
      operatingProfit1Percent: 0,
      operatingProfitEP1: 0,
      operatingProfitEP1Percent: 0,
      operatingProfitEP2: 0,
      operatingProfitEP2Percent: 0,
    },
    bestCase: {
      estimatedRevenueGoods: 0,
      estimatedRevenueServices: 0,
      estimatedRevenueHw: 0,
      estimatedMm: 0,
      estimatedMmItems: [],
      projectCosts: [{ item: "", amount: 0 }],
      otherGoodsItems: [],
      existingSystemLinkage: 0,
      riskCostPercent: 10,
      riskCostBase: "total_revenue",
      externalPurchasePercent: 0,
      externalPurchaseBase: "operating_profit",
      externalPurchase2Percent: 0,
      externalPurchase2Base: "operating_profit",
      includeExternalPurchase: false,
      includeExternalPurchase2: false,
      operatingProfit1: 0,
      operatingProfit1Percent: 0,
      operatingProfitEP1: 0,
      operatingProfitEP1Percent: 0,
      operatingProfitEP2: 0,
      operatingProfitEP2Percent: 0,
    },
    businessBasis: "",
    reviewResult: "",
    uiSettings: {
      heights: {}
    }
  });

  // 프로젝트 및 VRB 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        let proj: any = null;

        // 기준정보 데이터 가져오기 (고객사, 사용자)
        // 기준정보 데이터 가져오기 (고객사, 사용자, 내 정보)
        const [clientsRes, usersRes, meRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/users"),
          fetch("/api/auth/me"),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }


        // 프로젝트 정보 가져오기
        const projectResponse = await fetch(`/api/projects/${id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          proj = {
            id: projectData.project.id,
            name: projectData.project.name,
            projectCode: projectData.project.project_code,
            customerName: projectData.project.customer_name || "미지정",
            contractStartDate: projectData.project.contract_start_date,
            contractEndDate: projectData.project.contract_end_date,
            currency: projectData.project.currency || "KRW",
            salesRepresentativeName: projectData.project.sales_representative_name,
          };
          setProject(proj);
        }

        // 기존 VRB Review 가져오기
        const vrbResponse = await fetch(`/api/vrb-reviews?projectId=${id}`);
        if (vrbResponse.ok) {
          const vrbData = await vrbResponse.json();
          const allReviews = vrbData.reviews || [];

          console.log('[VRB INIT] API 응답:', {
            '전체 리뷰 개수': allReviews.length,
            '각 리뷰의 project_id': allReviews.map((r: any) => ({
              id: r.id,
              project_id: r.project_id,
              project_id_type: typeof r.project_id,
              status: r.status,
              version: r.version
            })),
            '현재 프로젝트 ID': id,
            '프로젝트 ID 타입': typeof id
          });

          // 프로젝트 ID로 한 번 더 필터링 (안전장치)
          const currentProjectId = parseInt(id, 10);
          const reviews = allReviews.filter(
            (review: any) => {
              // project_id를 명시적으로 숫자로 변환해서 비교
              const reviewProjectId = typeof review.project_id === 'string'
                ? parseInt(review.project_id, 10)
                : Number(review.project_id);
              const matches = reviewProjectId === currentProjectId;
              if (!matches) {
                console.log('[VRB INIT] 필터링 제외:', {
                  reviewId: review.id,
                  reviewProjectId: review.project_id,
                  reviewProjectIdParsed: reviewProjectId,
                  currentProjectId: currentProjectId,
                  '타입 비교': typeof reviewProjectId === typeof currentProjectId
                });
              }
              return matches;
            }
          );

          console.log('[VRB INIT] 필터링 결과:', {
            '필터링 전 개수': allReviews.length,
            '필터링 후 개수': reviews.length,
            '필터링된 리뷰': reviews.map((r: any) => ({
              id: r.id,
              project_id: r.project_id,
              status: r.status,
              version: r.version
            }))
          });

          if (reviews.length > 0) {
            // 최신 버전 선택
            const latestReview = reviews[0];
            setCurrentVrbId(latestReview.id);
            setIsNewVrb(false);

            // VRB 데이터 로드
            const detailResponse = await fetch(`/api/vrb-reviews/${latestReview.id}`);
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              const review = detailData.review;

              // 상태 및 반려 사유 로드
              setVrbStatus(review.status || "draft");
              setRejectionReason(review.rejection_reason || "");

              // 저장된 이름으로 검색어 초기화 (없으면 프로젝트 기본 정보 사용)
              const customerName = review.customer_name || proj?.customerName || "";
              setCustomerSearch(customerName);

              const salesName = review.sales_manager || proj?.salesRepresentativeName || "";
              setSalesSearch(salesName);

              if (review.ps_manager) {
                setPsSearch(review.ps_manager);
              }

              setVrbData({
                customerName: customerName,
                projectBudget: review.project_budget || "",
                winProbability: review.win_probability || "",
                winDate: review.win_date ? review.win_date.split('T')[0].substring(0, 7) : "",
                businessType: review.business_type || "",
                partners: review.partners || "",
                competitors: review.competitors || "",
                customerInfo: review.customer_info || "",
                salesManager: salesName,
                psManager: review.ps_manager || "",
                expectedStartDate: review.expected_start_date ? review.expected_start_date.split('T')[0].substring(0, 7) : "",
                expectedEndDate: review.expected_end_date ? review.expected_end_date.split('T')[0].substring(0, 7) : "",
                mainContractor: review.main_contractor || "",
                partnerInfo: review.partner_info || "",
                keySolutions: review.key_solutions || "",
                businessBackground: review.business_background || "",
                businessScope: review.business_scope || "",
                keyContents: (review.keyContents || []).map((c: any) => {
                  // API에서 이미 정규화된 날짜를 사용 (null이면 빈 문자열)
                  const normalizedDate = c.content_date && c.content_date !== null ? String(c.content_date) : "";
                  return {
                    date: normalizedDate,
                    content: c.content || "",
                    ui_height: c.ui_height || undefined,
                  };
                }),
                keyActivities: (review.keyActivities || []).map((a: any) => {
                  // API에서 이미 정규화된 날짜를 사용 (null이면 빈 문자열)
                  const normalizedDate = a.activity_date && a.activity_date !== null ? String(a.activity_date) : "";
                  return {
                    date: normalizedDate,
                    activity: a.activity || "",
                    attendees: a.attendees || "",
                    ui_height: a.ui_height || undefined,
                  };
                }),
                risk: review.risk || "",
                worstCase: {
                  estimatedRevenueGoods: parseFloat(review.worst_estimated_revenue_goods) || 0,
                  estimatedRevenueServices: parseFloat(review.worst_estimated_revenue_services) || 0,
                  estimatedRevenueHw: parseFloat(review.worst_estimated_revenue_hw) || 0,
                  estimatedMm: parseFloat((parseFloat(review.worst_estimated_mm) || 0).toFixed(2)),
                  estimatedMmItems: (review.worstCase?.estimatedMmItems && review.worstCase.estimatedMmItems.length > 0)
                    ? review.worstCase.estimatedMmItems.map((item: any) => ({
                      item: item.item || "",
                      mm: parseFloat((parseFloat(item.mm) || 0).toFixed(2)),
                    }))
                    : [],
                  projectCosts: (review.worstCase?.projectCosts && review.worstCase.projectCosts.length > 0)
                    ? review.worstCase.projectCosts.map((c: any) => ({
                      item: c.item || "",
                      amount: parseFloat(c.amount) || 0,
                    }))
                    : [{ item: "", amount: 0 }],
                  otherGoodsItems: (review.worstCase?.otherGoodsItems && review.worstCase.otherGoodsItems.length > 0)
                    ? review.worstCase.otherGoodsItems.map((item: any) => ({
                      item: item.item || "",
                      amount: parseFloat(item.amount) || 0,
                    }))
                    : [],
                  existingSystemLinkage: parseFloat(review.worst_existing_system_linkage) || 0,
                  riskCostPercent: review.worst_risk_cost_percent !== null && review.worst_risk_cost_percent !== undefined ? parseFloat(review.worst_risk_cost_percent) : 10,
                  riskCostBase: review.worst_risk_cost_base || "total_revenue",
                  externalPurchasePercent: review.worst_external_purchase_percent !== null && review.worst_external_purchase_percent !== undefined ? parseFloat(review.worst_external_purchase_percent) : 30,
                  externalPurchaseBase: review.worst_external_purchase_base || "operating_profit",
                  externalPurchase2Percent: parseFloat(review.worst_external_purchase2_percent) || 0,
                  externalPurchase2Base: review.worst_external_purchase2_base || "operating_profit",
                  includeExternalPurchase: review.worst_include_external_purchase === true || review.worst_include_external_purchase === 1 || false,
                  includeExternalPurchase2: review.worst_include_external_purchase2 === true || review.worst_include_external_purchase2 === 1 || false,
                  operatingProfit1: 0, // 계산으로 채워짐
                  operatingProfit1Percent: 0, // 계산으로 채워짐
                  operatingProfitEP1: parseFloat(review.worst_operating_profit) || 0,
                  operatingProfitEP1Percent: parseFloat(review.worst_operating_profit_percent) || 0,
                  operatingProfitEP2: parseFloat(review.worst_operating_profit2) || 0,
                  operatingProfitEP2Percent: parseFloat(review.worst_operating_profit2_percent) || 0,
                },
                bestCase: {
                  estimatedRevenueGoods: parseFloat(review.best_estimated_revenue_goods) || 0,
                  estimatedRevenueServices: parseFloat(review.best_estimated_revenue_services) || 0,
                  estimatedRevenueHw: parseFloat(review.best_estimated_revenue_hw) || 0,
                  estimatedMm: parseFloat((parseFloat(review.best_estimated_mm) || 0).toFixed(2)),
                  estimatedMmItems: (review.bestCase?.estimatedMmItems && review.bestCase.estimatedMmItems.length > 0)
                    ? review.bestCase.estimatedMmItems.map((item: any) => ({
                      item: item.item || "",
                      mm: parseFloat((parseFloat(item.mm) || 0).toFixed(2)),
                    }))
                    : [],
                  projectCosts: (review.bestCase?.projectCosts && review.bestCase.projectCosts.length > 0)
                    ? review.bestCase.projectCosts.map((c: any) => ({
                      item: c.item || "",
                      amount: parseFloat(c.amount) || 0,
                    }))
                    : [],
                  otherGoodsItems: (review.bestCase?.otherGoodsItems && review.bestCase.otherGoodsItems.length > 0)
                    ? review.bestCase.otherGoodsItems.map((item: any) => ({
                      item: item.item || "",
                      amount: parseFloat(item.amount) || 0,
                    }))
                    : [],
                  existingSystemLinkage: parseFloat(review.best_existing_system_linkage) || 0,
                  riskCostPercent: review.best_risk_cost_percent !== null && review.best_risk_cost_percent !== undefined ? parseFloat(review.best_risk_cost_percent) : 10,
                  riskCostBase: review.best_risk_cost_base || "total_revenue",
                  externalPurchasePercent: review.best_external_purchase_percent !== null && review.best_external_purchase_percent !== undefined ? parseFloat(review.best_external_purchase_percent) : 30,
                  externalPurchaseBase: review.best_external_purchase_base || "operating_profit",
                  externalPurchase2Percent: parseFloat(review.best_external_purchase2_percent) || 0,
                  externalPurchase2Base: review.best_external_purchase2_base || "operating_profit",
                  includeExternalPurchase: review.best_include_external_purchase === true || review.best_include_external_purchase === 1 || false,
                  includeExternalPurchase2: review.best_include_external_purchase2 === true || review.best_include_external_purchase2 === 1 || false,
                  operatingProfit1: 0, // 계산으로 채워짐
                  operatingProfit1Percent: 0, // 계산으로 채워짐
                  operatingProfitEP1: parseFloat(review.best_operating_profit) || 0,
                  operatingProfitEP1Percent: parseFloat(review.best_operating_profit_percent) || 0,
                  operatingProfitEP2: parseFloat(review.best_operating_profit2) || 0,
                  operatingProfitEP2Percent: parseFloat(review.best_operating_profit2_percent) || 0,
                },
                businessBasis: review.business_basis || "",
                reviewResult: review.review_result || "",
                uiSettings: review.ui_settings || { heights: {} },
              });
            }
          } else {
            // 신규 VRB 생성 - 프로젝트 정보로 초기화
            setIsNewVrb(true);
            setCurrentVrbId(null);

            if (proj) {
              // 프로젝트 정보로 초기화 및 검색어 설정
              const customerName = proj.customerName || "";
              const salesName = proj.salesRepresentativeName || "";

              setCustomerSearch(customerName);
              setSalesSearch(salesName);

              setVrbData((prev) => ({
                ...prev,
                customerName: customerName,
                salesManager: salesName,
                expectedStartDate: proj.contract_start_date ? proj.contract_start_date.split('T')[0].substring(0, 7) : "",
                expectedEndDate: proj.contract_end_date ? proj.contract_end_date.split('T')[0].substring(0, 7) : "",
              }));
            }

            // 신규 VRB인 경우에만 M/D 산정에서 Best Case 예상 M/M 가져오기
            const mdResponse = await fetch(`/api/md-estimations?projectId=${id}`);
            if (mdResponse.ok) {
              const mdData = await mdResponse.json();
              const estimations = mdData.estimations || [];

              if (estimations.length > 0) {
                // 최신 완료된 M/D 산정 찾기
                const completedEstimation = estimations.find((e: any) => e.status === 'completed') || estimations[0];
                const estimationId = completedEstimation.id;

                // M/D 산정 상세 데이터 가져오기
                const detailResponse = await fetch(`/api/md-estimations/${estimationId}`);
                if (detailResponse.ok) {
                  const detailData = await detailResponse.json();
                  const estimation = detailData.estimation;

                  // 최종 M/M 값 사용 (상세 내역의 M/M 값)
                  const finalDevelopmentMm = parseFloat(estimation.finalDevelopmentMm) || 0;
                  const finalModeling3dMm = parseFloat(estimation.finalModeling3dMm) || 0;
                  const finalPidMm = parseFloat(estimation.finalPidMm) || 0;

                  console.log('[VRB] 신규 VRB 생성 - M/D 산정에서 Best Case 예상 M/M 가져오기:', {
                    finalDevelopmentMm,
                    finalModeling3dMm,
                    finalPidMm,
                    total: finalDevelopmentMm + finalModeling3dMm + finalPidMm,
                  });

                  // M/M 항목들을 Best Case에 설정 (최종 M/M 값 사용, 소수점 2자리로 반올림)
                  const mmItems: Array<{ item: string; mm: number }> = [];
                  if (finalDevelopmentMm > 0) {
                    mmItems.push({ item: "개발", mm: parseFloat(finalDevelopmentMm.toFixed(2)) });
                  }
                  if (finalModeling3dMm > 0) {
                    mmItems.push({ item: "3D 모델링", mm: parseFloat(finalModeling3dMm.toFixed(2)) });
                  }
                  if (finalPidMm > 0) {
                    mmItems.push({ item: "P&ID", mm: parseFloat(finalPidMm.toFixed(2)) });
                  }

                  const totalMm = parseFloat((finalDevelopmentMm + finalModeling3dMm + finalPidMm).toFixed(2));

                  setVrbData((prev) => ({
                    ...prev,
                    bestCase: {
                      ...prev.bestCase,
                      estimatedMm: totalMm,
                      estimatedMmItems: mmItems,
                    },
                  }));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddContent = () => {
    setVrbData((prev) => ({
      ...prev,
      keyContents: [
        ...prev.keyContents,
        { date: "", content: "" },
      ],
    }));
  };

  const handleRemoveContent = (index: number) => {
    setVrbData((prev) => ({
      ...prev,
      keyContents: prev.keyContents.filter((_, i) => i !== index),
    }));
  };

  const handleContentChange = (index: number, field: string, value: string) => {
    setVrbData((prev) => ({
      ...prev,
      keyContents: prev.keyContents.map((content, i) =>
        i === index ? { ...content, [field]: value } : content
      ),
    }));
  };



  const handleAddActivity = () => {
    setVrbData((prev) => ({
      ...prev,
      keyActivities: [
        ...prev.keyActivities,
        { date: "", activity: "", attendees: "" },
      ],
    }));
  };

  const handleRemoveActivity = (index: number) => {
    setVrbData((prev) => ({
      ...prev,
      keyActivities: prev.keyActivities.filter((_, i) => i !== index),
    }));
  };

  const handleActivityChange = (index: number, field: string, value: string) => {
    setVrbData((prev) => ({
      ...prev,
      keyActivities: prev.keyActivities.map((act, i) =>
        i === index ? { ...act, [field]: value } : act
      ),
    }));
  };

  // 텍스트에어리어 높이 저장 핸들러
  const handleHeightChange = (id: string, height: number) => {
    setVrbData((prev) => ({
      ...prev,
      uiSettings: {
        ...(prev.uiSettings || { heights: {} }),
        heights: {
          ...(prev.uiSettings?.heights || {}),
          [id]: height,
        },
      },
    }));
  };

  const handleContentHeightChange = (index: number, height: number) => {
    setVrbData((prev) => ({
      ...prev,
      keyContents: prev.keyContents.map((content, i) =>
        i === index ? { ...content, ui_height: height } : content
      ),
    }));
  };

  const handleActivityHeightChange = (index: number, height: number) => {
    setVrbData((prev) => ({
      ...prev,
      keyActivities: prev.keyActivities.map((activity, i) =>
        i === index ? { ...activity, ui_height: height } : activity
      ),
    }));
  };



  const handleAddProjectCost = (type: "worst" | "best") => {
    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...prev[type === "worst" ? "worstCase" : "bestCase"],
        projectCosts: [
          ...prev[type === "worst" ? "worstCase" : "bestCase"].projectCosts,
          { item: "", amount: 0 },
        ],
      },
    }));
  };

  const handleRemoveProjectCost = (type: "worst" | "best", index: number) => {
    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...prev[type === "worst" ? "worstCase" : "bestCase"],
        projectCosts: prev[type === "worst" ? "worstCase" : "bestCase"].projectCosts.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleProjectCostChange = (
    type: "worst" | "best",
    index: number,
    field: string,
    value: string | number
  ) => {
    setVrbData((prev) => {
      const caseData = prev[type === "worst" ? "worstCase" : "bestCase"];
      return {
        ...prev,
        [type === "worst" ? "worstCase" : "bestCase"]: {
          ...caseData,
          projectCosts: caseData.projectCosts.map((cost, i) =>
            i === index ? { ...cost, [field]: value } : cost
          ),
        },
      };
    });
  };

  const handleOtherGoodsAdd = (type: "worst" | "best") => {
    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...prev[type === "worst" ? "worstCase" : "bestCase"],
        otherGoodsItems: [
          ...prev[type === "worst" ? "worstCase" : "bestCase"].otherGoodsItems,
          { item: "", amount: 0 },
        ],
      },
    }));
  };

  const handleOtherGoodsRemove = (type: "worst" | "best", index: number) => {
    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...prev[type === "worst" ? "worstCase" : "bestCase"],
        otherGoodsItems: prev[
          type === "worst" ? "worstCase" : "bestCase"
        ].otherGoodsItems.filter((_, i) => i !== index),
      },
    }));
  };

  const handleOtherGoodsChange = (
    type: "worst" | "best",
    index: number,
    field: string,
    value: string | number
  ) => {
    setVrbData((prev) => {
      const caseData = prev[type === "worst" ? "worstCase" : "bestCase"];
      const updatedItems = caseData.otherGoodsItems.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return {
        ...prev,
        [type === "worst" ? "worstCase" : "bestCase"]: {
          ...caseData,
          otherGoodsItems: updatedItems,
        },
      };
    });
  };

  const handleAddEstimatedMm = (type: "worst" | "best") => {
    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...prev[type === "worst" ? "worstCase" : "bestCase"],
        estimatedMmItems: [
          ...prev[type === "worst" ? "worstCase" : "bestCase"].estimatedMmItems,
          { item: "", mm: 0 },
        ],
      },
    }));
  };

  const handleRemoveEstimatedMm = (type: "worst" | "best", index: number) => {
    setVrbData((prev) => {
      const caseData = prev[type === "worst" ? "worstCase" : "bestCase"];
      const updatedItems = caseData.estimatedMmItems.filter((_, i) => i !== index);
      const totalMm = parseFloat(updatedItems.reduce((sum, item) => sum + item.mm, 0).toFixed(2));
      return {
        ...prev,
        [type === "worst" ? "worstCase" : "bestCase"]: {
          ...caseData,
          estimatedMmItems: updatedItems,
          estimatedMm: totalMm,
        },
      };
    });
  };

  const handleEstimatedMmChange = (
    type: "worst" | "best",
    index: number,
    field: string,
    value: string | number
  ) => {
    setVrbData((prev) => {
      const caseData = prev[type === "worst" ? "worstCase" : "bestCase"];
      const updatedItems = caseData.estimatedMmItems.map((item, i) => {
        if (i === index) {
          if (field === "mm") {
            // 숫자 값인 경우 그대로 사용 (입력 중에는 소수점이 포함된 값일 수 있음)
            const numValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
            return { ...item, [field]: numValue };
          }
          return { ...item, [field]: value };
        }
        return item;
      });
      const totalMm = parseFloat(updatedItems.reduce((sum, item) => sum + item.mm, 0).toFixed(2));
      return {
        ...prev,
        [type === "worst" ? "worstCase" : "bestCase"]: {
          ...caseData,
          estimatedMmItems: updatedItems,
          estimatedMm: totalMm,
        },
      };
    });
  };

  // 고객사 선택 핸들러
  const handleCustomerSelect = (clientId: string, clientName: string) => {
    setVrbData((prev) => ({ ...prev, customerName: clientName }));
    setCustomerSearch(clientName);
    setShowCustomerDropdown(false);
  };

  // 영업 선택 핸들러
  const handleSalesSelect = (userId: string, userName: string) => {
    setVrbData((prev) => ({ ...prev, salesManager: userName }));
    setSalesSearch(userName);
    setShowSalesDropdown(false);
  };

  // PS 선택 핸들러
  const handlePsSelect = (userId: string, userName: string) => {
    setVrbData((prev) => ({ ...prev, psManager: userName }));
    setPsSearch(userName);
    setShowPsDropdown(false);
  };

  // 필터링된 고객사 목록 (type === 'customer')
  const filteredCustomers = clients.filter(
    (client) =>
      client.type === "customer" &&
      client.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // 필터링된 영업 목록 (role_name === 'sales')
  const filteredSales = users.filter(
    (user) =>
      user.role_name === "sales" &&
      (user.name.toLowerCase().includes(salesSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  // 필터링된 PS 목록 (role_name === 'sales')
  const filteredPs = users.filter(
    (user) =>
      user.role_name === "sales" &&
      (user.name.toLowerCase().includes(psSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(psSearch.toLowerCase()))
  );

  const calculateProfitability = (type: "worst" | "best") => {
    const caseData = vrbData[type === "worst" ? "worstCase" : "bestCase"];

    // 예상수주금액(물품+용역+HW)
    const totalRevenue = caseData.estimatedRevenueGoods + caseData.estimatedRevenueServices + caseData.estimatedRevenueHw;

    // 타사상품매입 합계
    const otherGoodsPurchase = (caseData.otherGoodsItems || []).reduce((sum, item) => sum + item.amount, 0);

    // 프로젝트수행비용 합계
    const totalProjectCosts = (caseData.projectCosts || []).reduce((sum, cost) => sum + cost.amount, 0);

    // 예상M/M합계 (M/M * 천만원)
    const estimatedMmCost = (caseData.estimatedMmItems || []).reduce((sum, item) => sum + (item.mm * 10000000), 0);

    // 리스크비용 계산 기준 값 가져오기
    let riskCostBaseValue = totalRevenue;
    if (caseData.riskCostBase === "revenue_sw") riskCostBaseValue = caseData.estimatedRevenueGoods;
    else if (caseData.riskCostBase === "revenue_hw") riskCostBaseValue = caseData.estimatedRevenueHw;
    else if (caseData.riskCostBase === "revenue_service") riskCostBaseValue = caseData.estimatedRevenueServices;
    else if (caseData.riskCostBase === "operating_profit") riskCostBaseValue = 0; // 아직 안구해짐, 리스크비용은 영업이익 기준이 아님 (순환참조 문제)

    // 리스크비용
    const riskCost = (riskCostBaseValue * caseData.riskCostPercent) / 100;

    // 영업이익 = 예상수주금액(물품+용역+HW) - 타사상품매입 - 프로젝트수행비용 합계 - 예상M/M합계 - 리스크비용
    const operatingProfit1 = totalRevenue - otherGoodsPurchase - totalProjectCosts - estimatedMmCost - riskCost;
    const operatingProfit1Percent = totalRevenue > 0 ? (operatingProfit1 / totalRevenue) * 100 : 0;

    // 외부매입1 계산 기준 값 가져오기
    let externalPurchase1BaseValue = operatingProfit1;
    if (caseData.externalPurchaseBase === "total_revenue") externalPurchase1BaseValue = totalRevenue;
    else if (caseData.externalPurchaseBase === "revenue_sw") externalPurchase1BaseValue = caseData.estimatedRevenueGoods;
    else if (caseData.externalPurchaseBase === "revenue_hw") externalPurchase1BaseValue = caseData.estimatedRevenueHw;
    else if (caseData.externalPurchaseBase === "revenue_service") externalPurchase1BaseValue = caseData.estimatedRevenueServices;

    // 외부매입 비용 (외부매입반영 계산용)
    const externalPurchase1Cost = caseData.includeExternalPurchase
      ? (caseData.externalPurchaseBase === "operating_profit_ep1"
        ? (operatingProfit1 * caseData.externalPurchasePercent) / (100 + caseData.externalPurchasePercent)
        : (externalPurchase1BaseValue * caseData.externalPurchasePercent) / 100)
      : 0;

    // 영업이익(외부매입1 반영)
    const operatingProfitEP1 = operatingProfit1 - externalPurchase1Cost;
    const operatingProfitEP1Percent = totalRevenue > 0 ? (operatingProfitEP1 / totalRevenue) * 100 : 0;

    // 외부매입2 계산 기준 값 가져오기
    let externalPurchase2BaseValue = operatingProfit1;
    if (caseData.externalPurchase2Base === "total_revenue") externalPurchase2BaseValue = totalRevenue;
    else if (caseData.externalPurchase2Base === "revenue_sw") externalPurchase2BaseValue = caseData.estimatedRevenueGoods;
    else if (caseData.externalPurchase2Base === "revenue_hw") externalPurchase2BaseValue = caseData.estimatedRevenueHw;
    else if (caseData.externalPurchase2Base === "revenue_service") externalPurchase2BaseValue = caseData.estimatedRevenueServices;
    else if (caseData.externalPurchase2Base === "operating_profit_ep1") externalPurchase2BaseValue = operatingProfitEP1;

    const externalPurchase2Cost = caseData.includeExternalPurchase2
      ? (externalPurchase2BaseValue * caseData.externalPurchase2Percent) / 100
      : 0;

    // 영업이익(외부매입2 반영): 기존 반영된 금액에서 추가 차감
    const operatingProfitEP2 = operatingProfitEP1 - externalPurchase2Cost;
    const operatingProfitEP2Percent = totalRevenue > 0 ? (operatingProfitEP2 / totalRevenue) * 100 : 0;

    // 디버깅 로그
    console.log(`[${type.toUpperCase()} Case] 계산 결과:`, {
      totalRevenue,
      operatingProfit1,
      externalPurchase1Percent: caseData.externalPurchasePercent,
      externalPurchase1Cost,
      operatingProfitEP1,
      externalPurchase2Percent: caseData.externalPurchase2Percent,
      externalPurchase2Cost,
      operatingProfitEP2,
    });

    setVrbData((prev) => ({
      ...prev,
      [type === "worst" ? "worstCase" : "bestCase"]: {
        ...caseData,
        operatingProfit1,
        operatingProfit1Percent,
        operatingProfitEP1,
        operatingProfitEP1Percent,
        operatingProfitEP2,
        operatingProfitEP2Percent,
      },
    }));
  };

  useEffect(() => {
    calculateProfitability("worst");
    calculateProfitability("best");
  }, [
    vrbData.worstCase.estimatedRevenueGoods,
    vrbData.worstCase.estimatedRevenueServices,
    vrbData.worstCase.projectCosts,
    vrbData.worstCase.otherGoodsItems,
    vrbData.worstCase.riskCostPercent,
    vrbData.worstCase.riskCostBase,
    vrbData.worstCase.externalPurchasePercent,
    vrbData.worstCase.externalPurchaseBase,
    vrbData.worstCase.externalPurchase2Percent,
    vrbData.worstCase.externalPurchase2Base,
    vrbData.worstCase.includeExternalPurchase,
    vrbData.worstCase.includeExternalPurchase2,
    vrbData.worstCase.estimatedMmItems,
    vrbData.bestCase.estimatedRevenueGoods,
    vrbData.bestCase.estimatedRevenueServices,
    vrbData.bestCase.projectCosts,
    vrbData.bestCase.otherGoodsItems,
    vrbData.bestCase.riskCostPercent,
    vrbData.bestCase.riskCostBase,
    vrbData.bestCase.externalPurchasePercent,
    vrbData.bestCase.externalPurchaseBase,
    vrbData.bestCase.externalPurchase2Percent,
    vrbData.bestCase.externalPurchase2Base,
    vrbData.bestCase.includeExternalPurchase,
    vrbData.bestCase.includeExternalPurchase2,
    vrbData.bestCase.estimatedMmItems,
  ]);

  // VRB Review 저장
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let vrbId = currentVrbId;

      // 새 VRB Review인 경우 먼저 생성
      if (isNewVrb || !vrbId) {
        const createResponse = await fetch("/api/vrb-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: parseInt(id),
            created_by: currentUser?.id || 1,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `VRB Review 생성에 실패했습니다. (${createResponse.status})`);
        }

        const createData = await createResponse.json();
        vrbId = createData.id;
        setCurrentVrbId(vrbId);
        setIsNewVrb(false);
      }

      // M/D 산정 ID 가져오기
      const mdResponse = await fetch(`/api/md-estimations?projectId=${id}`);
      let mdEstimationId = null;
      if (mdResponse.ok) {
        const mdData = await mdResponse.json();
        const estimations = mdData.estimations || [];
        if (estimations.length > 0) {
          const completedEstimation = estimations.find((e: any) => e.status === 'COMPLETED') || estimations[0];
          mdEstimationId = completedEstimation.id;
        }
      }

      // VRB 데이터 저장
      const updateResponse = await fetch(`/api/vrb-reviews/${vrbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(id), // 프로젝트 ID 검증을 위해 포함
          customer_name: vrbData.customerName,
          project_budget: vrbData.projectBudget,
          win_probability: vrbData.winProbability,
          win_date: vrbData.winDate ? `${vrbData.winDate}-01` : null,
          business_type: vrbData.businessType,
          partners: vrbData.partners,
          partner_info: vrbData.partnerInfo,
          competitors: vrbData.competitors,
          customer_info: vrbData.customerInfo,
          sales_manager: vrbData.salesManager,
          ps_manager: vrbData.psManager,
          expected_start_date: vrbData.expectedStartDate ? `${vrbData.expectedStartDate}-01` : null,
          expected_end_date: vrbData.expectedEndDate ? `${vrbData.expectedEndDate}-01` : null,
          main_contractor: vrbData.mainContractor,
          key_solutions: vrbData.keySolutions,
          business_background: vrbData.businessBackground,
          business_scope: vrbData.businessScope,
          risk: vrbData.risk,
          business_basis: vrbData.businessBasis,
          review_result: vrbData.reviewResult,
          ui_settings: vrbData.uiSettings,
          worst_estimated_revenue_goods: vrbData.worstCase.estimatedRevenueGoods,
          worst_estimated_revenue_services: vrbData.worstCase.estimatedRevenueServices,
          worst_estimated_revenue_hw: vrbData.worstCase.estimatedRevenueHw,
          worst_estimated_mm: vrbData.worstCase.estimatedMm,
          worst_existing_system_linkage: vrbData.worstCase.existingSystemLinkage,
          worst_risk_cost_percent: vrbData.worstCase.riskCostPercent,
          worst_risk_cost_base: vrbData.worstCase.riskCostBase,
          worst_external_purchase_percent: vrbData.worstCase.externalPurchasePercent,
          worst_external_purchase_base: vrbData.worstCase.externalPurchaseBase,
          worst_external_purchase2_percent: vrbData.worstCase.externalPurchase2Percent,
          worst_external_purchase2_base: vrbData.worstCase.externalPurchase2Base,
          worst_include_external_purchase: vrbData.worstCase.includeExternalPurchase,
          worst_include_external_purchase2: vrbData.worstCase.includeExternalPurchase2,
          worst_operating_profit: vrbData.worstCase.operatingProfitEP1,
          worst_operating_profit_percent: vrbData.worstCase.operatingProfitEP1Percent,
          worst_operating_profit2: vrbData.worstCase.operatingProfitEP2,
          worst_operating_profit2_percent: vrbData.worstCase.operatingProfitEP2Percent,
          best_estimated_revenue_goods: vrbData.bestCase.estimatedRevenueGoods,
          best_estimated_revenue_services: vrbData.bestCase.estimatedRevenueServices,
          best_estimated_revenue_hw: vrbData.bestCase.estimatedRevenueHw,
          best_estimated_mm: vrbData.bestCase.estimatedMm,
          best_existing_system_linkage: vrbData.bestCase.existingSystemLinkage,
          best_risk_cost_percent: vrbData.bestCase.riskCostPercent,
          best_risk_cost_base: vrbData.bestCase.riskCostBase,
          best_external_purchase_percent: vrbData.bestCase.externalPurchasePercent,
          best_external_purchase_base: vrbData.bestCase.externalPurchaseBase,
          best_external_purchase2_percent: vrbData.bestCase.externalPurchase2Percent,
          best_external_purchase2_base: vrbData.bestCase.externalPurchase2Base,
          best_include_external_purchase: vrbData.bestCase.includeExternalPurchase,
          best_include_external_purchase2: vrbData.bestCase.includeExternalPurchase2,
          best_operating_profit: vrbData.bestCase.operatingProfitEP1,
          best_operating_profit_percent: vrbData.bestCase.operatingProfitEP1Percent,
          best_operating_profit2: vrbData.bestCase.operatingProfitEP2,
          best_operating_profit2_percent: vrbData.bestCase.operatingProfitEP2Percent,
          md_estimation_id: mdEstimationId,
          worstCase: {
            projectCosts: vrbData.worstCase.projectCosts.map((c) => ({
              item: c.item,
              amount: c.amount,
            })),
            estimatedMmItems: vrbData.worstCase.estimatedMmItems.map((item) => ({
              item: item.item,
              mm: item.mm,
            })),
            otherGoodsItems: vrbData.worstCase.otherGoodsItems.map((item) => ({
              item: item.item,
              amount: item.amount,
            })),
          },
          bestCase: {
            projectCosts: vrbData.bestCase.projectCosts.map((c) => ({
              item: c.item,
              amount: c.amount,
            })),
            estimatedMmItems: vrbData.bestCase.estimatedMmItems.map((item) => ({
              item: item.item,
              mm: item.mm,
            })),
            otherGoodsItems: vrbData.bestCase.otherGoodsItems.map((item) => ({
              item: item.item,
              amount: item.amount,
            })),
          },
          keyContents: vrbData.keyContents.map((c) => ({
            content_date: c.date && c.date.trim() !== "" ? c.date : null,
            content: c.content,
            ui_height: c.ui_height,
          })),
          keyActivities: vrbData.keyActivities.map((a) => ({
            activity_date: a.date && a.date.trim() !== "" ? a.date : null,
            activity: a.activity,
            attendees: a.attendees,
            ui_height: a.ui_height,
          })),
          status: (vrbStatus === 'STANDBY' || vrbStatus === 'draft') ? 'IN_PROGRESS' : vrbStatus,
        }),
      });

      if (updateResponse.ok) {
        if (vrbStatus === 'STANDBY' || vrbStatus === 'draft') {
          setVrbStatus('IN_PROGRESS');
        }
      }

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error('[VRB Save] 저장 실패 응답:', {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          errorData,
        });
        throw new Error(errorData.message || errorData.error || "VRB Review 저장에 실패했습니다.");
      }

      showAlert("VRB가 저장되었습니다.", "success");
    } catch (error: any) {
      console.error("[VRB Save] 저장 에러:", error);
      showAlert(error.message || "VRB Review 저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [id, currentVrbId, isNewVrb, vrbData]);

  // 심의 결과 처리 (진행/미진행)
  const handleReviewDecision = useCallback(async (decision: "PROCEED" | "STOP") => {
    if (!currentVrbId) {
      showAlert("VRB Review를 먼저 저장해주세요.", "warning");
      return;
    }

    const title = decision === "PROCEED" ? "진행" : "미진행";

    confirm({
      title: `VRB 심의 결과 - ${title}`,
      message: `심의 결과를 '${title}'으로 확정하시겠습니까?`,
      confirmText: title,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/vrb-reviews/${currentVrbId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: parseInt(id),
              review_result: decision,
            }),
          });

          if (!response.ok) {
            throw new Error("처리 중 오류가 발생했습니다.");
          }

          setVrbData(prev => ({ ...prev, reviewResult: decision }));
          setRejectionReason("");
          showAlert(`심의 결과가 '${title}'으로 등록되었습니다.`, decision === "PROCEED" ? "success" : "info");
        } catch (error: any) {
          showAlert(error.message || "처리 중 오류가 발생했습니다.", "error");
        }
      }
    });

  }, [currentVrbId, id, confirm, showAlert]);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentVrbId) {
      showAlert("먼저 저장을 해주세요.", "warning");
      return;
    }

    try {
      const response = await fetch(`/api/vrb-reviews/${currentVrbId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: parseInt(id),
          status: newStatus,
        }),
      });

      if (response.ok) {
        setVrbStatus(newStatus);
        // showAlert("상태가 변경되었습니다.", "success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showAlert(`상태 변경 실패: ${errorData.message || '알 수 없는 오류'}`, "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("상태 변경 중 오류가 발생했습니다.", "error");
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!currentVrbId) return;

    confirm({
      title: "VRB Review 삭제",
      message: "정말로 이 VRB Review를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/vrb-reviews/${currentVrbId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            showAlert("VRB Review가 삭제되었습니다.", "success");
            // 삭제 후 목록으로 이동하거나 상태 초기화
            router.push(`/projects/${id}`);
          } else {
            const error = await response.json();
            showAlert(`삭제 실패: ${error.message || '알 수 없는 오류'}`, "error");
          }
        } catch (e) {
          console.error(e);
          showAlert("삭제 중 오류가 발생했습니다.", "error");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vrb-review"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                VRB - {project?.name || "프로젝트"}
              </h1>
              <StatusBadge
                status={vrbStatus || 'STANDBY'}
              />
              <ProjectPhaseNav projectId={id} />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {project?.projectCode} | {project?.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 상태별 상단 액션 버튼 노출 정의 */}
          {vrbStatus === 'IN_PROGRESS' && currentVrbId && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}

          {vrbStatus === 'COMPLETED' && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm border-2 shadow-sm",
              vrbData.reviewResult === 'PROCEED'
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}>
              {vrbData.reviewResult === 'PROCEED' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {vrbData.reviewResult === 'PROCEED' ? '심의 결과 : 진행' : '심의 결과 : 미진행'}
            </div>
          )}

          {(vrbStatus === 'IN_PROGRESS' || vrbStatus === 'COMPLETED') && (
            <Button
              variant="secondary"
              className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              엑셀
            </Button>
          )}

          {vrbStatus === 'IN_PROGRESS' && (
            <Button
              variant="primary"
              onClick={async () => {
                await handleSave();
                await handleStatusChange('COMPLETED');
              }}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              작성완료
            </Button>
          )}


        </div>
      </div>

      {/* Main Container Card */}
      <div className="neo-light-card border border-border/40 p-6 space-y-6">
        {/* 1. 사업개요 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">1. 사업개요</h2>
            <div className="flex items-center gap-3">
              {
                (vrbStatus !== 'COMPLETED') && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    저장
                  </button>
                )
              }
            </div>
          </div>
          <div className="overflow-hidden rounded-none">
            <table className="w-full border-collapse text-sm table-fixed">
              <colgroup>
                <col className="w-[11%] bg-blue-50/50" />
                <col className="w-[22%] bg-white" />
                <col className="w-[11%] bg-blue-50/50" />
                <col className="w-[22%] bg-white" />
                <col className="w-[11%] bg-blue-50/50" />
                <col className="w-[23%] bg-white" />
              </colgroup>
              <tbody>
                {/* Row 1: Customer Name (2), Business Name (4) */}
                <tr className="border-b border-gray-300 min-h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">고객사명</th>
                  <td className="border border-gray-300 p-0 relative h-[35px]">
                    <div className="relative w-full h-full">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                          if (!e.target.value) {
                            setVrbData((prev) => ({ ...prev, customerName: "" }));
                          }
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="고객사명 또는 코드로 검색..."
                        disabled={isReadOnly}
                        className="w-full h-full border-none bg-transparent px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)} />
                          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-none border border-gray-300 bg-white shadow-md">
                            {filteredCustomers.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => handleCustomerSelect(client.id.toString(), client.name)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                              >
                                <div className="font-medium text-gray-900">{client.name}</div>
                                {client.code && <div className="text-xs text-gray-500">{client.code}</div>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">사업명</th>
                  <td className="border border-gray-300 p-0 h-[35px]" colSpan={3}>
                    <input
                      type="text"
                      value={project?.name || ""}
                      readOnly
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none rounded-none"
                    />
                  </td>
                </tr>

                {/* Row 2: Project Budget (2), Customer Info (4) */}
                <tr className="border-b border-gray-300 min-h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">사업예산 (VAT포함)</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.projectBudget}
                      onChange={(e) => setVrbData({ ...vrbData, projectBudget: e.target.value })}
                      placeholder="예: 2.14억"
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors placeholder-gray-400"
                    />
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">고객 정보</th>
                  <td className="border border-gray-300 p-0 h-[35px]" colSpan={3}>
                    <input
                      type="text"
                      value={vrbData.customerInfo}
                      onChange={(e) => setVrbData({ ...vrbData, customerInfo: e.target.value })}
                      placeholder="예: 계통사업처/계통제어부"
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors placeholder-gray-400"
                    />
                  </td>
                </tr>

                {/* Row 3: Win Probability (2), Sales (2), PS (2) */}
                <tr className="border-b border-gray-300 min-h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">수주확률</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <select
                      value={vrbData.winProbability}
                      onChange={(e) => setVrbData({ ...vrbData, winProbability: e.target.value })}
                      disabled={isReadOnly}
                      className={cn("w-full h-full border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none", vrbData.winProbability === "" ? "text-gray-400" : "text-gray-900")}
                    >
                      <option value="">선택</option>
                      <option value="상(90%)">상(90%)</option>
                      <option value="중(60%)">중(60%)</option>
                      <option value="하(30%)">하(30%)</option>
                    </select>
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">담당영업</th>
                  <td className="border border-gray-300 p-0 relative h-[35px]">
                    <div className="relative w-full h-full">
                      <input
                        type="text"
                        value={salesSearch}
                        onChange={(e) => {
                          setSalesSearch(e.target.value);
                          setShowSalesDropdown(true);
                          if (!e.target.value) setVrbData((prev) => ({ ...prev, salesManager: "" }));
                        }}
                        onFocus={() => setShowSalesDropdown(true)}
                        placeholder="영업대표 검색..."
                        disabled={isReadOnly}
                        className="w-full h-full border-none bg-transparent px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                      />
                      {showSalesDropdown && filteredSales.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowSalesDropdown(false)} />
                          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-none border border-gray-300 bg-white shadow-md">
                            {filteredSales.map((user) => (
                              <button key={user.id} type="button" onClick={() => handleSalesSelect(user.id.toString(), user.name)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                                <div className="font-bold text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">PS</th>
                  <td className="border border-gray-300 p-0 relative h-[35px]">
                    <div className="relative w-full h-full">
                      <input
                        type="text"
                        value={psSearch}
                        onChange={(e) => {
                          setPsSearch(e.target.value);
                          setShowPsDropdown(true);
                          if (!e.target.value) setVrbData((prev) => ({ ...prev, psManager: "" }));
                        }}
                        onFocus={() => setShowPsDropdown(true)}
                        placeholder="PS 검색..."
                        disabled={isReadOnly}
                        className="w-full h-full border-none bg-transparent px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                      />
                      {showPsDropdown && filteredPs.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowPsDropdown(false)} />
                          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-none border border-gray-300 bg-white shadow-md">
                            {filteredPs.map((user) => (
                              <button key={user.id} type="button" onClick={() => handlePsSelect(user.id.toString(), user.name)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                                <div className="font-bold text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Row 4: Win Date (2), Expected Period (4) */}
                <tr className="border-b border-gray-300 min-h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">수주시기</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <DatePicker
                      date={vrbData.winDate ? new Date(vrbData.winDate + "-01") : undefined}
                      setDate={(date) => setVrbData({ ...vrbData, winDate: date ? format(date, "yyyy-MM") : "" })}
                      disabled={isReadOnly}
                      className="w-full h-full"
                      buttonClassName="border-none shadow-none w-full h-full rounded-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 transition-colors justify-start px-[10px]"
                      mode="month"
                      dateFormat="yyyy-MM"
                      placeholder="YYYY-MM"
                    />
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">예상 사업기간</th>
                  <td className="border border-gray-300 p-0 h-[35px]" colSpan={3}>
                    <div className="flex items-center gap-0.5 h-full">
                      <DatePicker
                        date={vrbData.expectedStartDate ? new Date(vrbData.expectedStartDate + "-01") : undefined}
                        setDate={(date) => setVrbData({ ...vrbData, expectedStartDate: date ? format(date, "yyyy-MM") : "" })}
                        disabled={isReadOnly}
                        className="h-full w-[90px]"
                        buttonClassName="border-none shadow-none w-full h-full rounded-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 transition-colors justify-center px-0 text-sm"
                        mode="month"
                        dateFormat="yyyy-MM"
                        placeholder="YYYY-MM"
                      />
                      <span className="text-gray-400">~</span>
                      <DatePicker
                        date={vrbData.expectedEndDate ? new Date(vrbData.expectedEndDate + "-01") : undefined}
                        setDate={(date) => setVrbData({ ...vrbData, expectedEndDate: date ? format(date, "yyyy-MM") : "" })}
                        disabled={isReadOnly}
                        className="h-full w-[90px]"
                        buttonClassName="border-none shadow-none w-full h-full rounded-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 transition-colors justify-center px-0 text-sm"
                        mode="month"
                        dateFormat="yyyy-MM"
                        placeholder="YYYY-MM"
                      />
                    </div>
                  </td>
                </tr>

                {/* Row 5: Business Type (2), Main Contractor (2), Key Solutions (2) */}
                <tr className="border-b border-gray-300 min-h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">사업형태</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <select
                      value={vrbData.businessType}
                      onChange={(e) => setVrbData({ ...vrbData, businessType: e.target.value })}
                      disabled={isReadOnly}
                      className={cn("w-full h-full border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none", vrbData.businessType === "" ? "text-gray-400" : "text-gray-900")}
                    >
                      <option value="">선택</option>
                      <option value="입찰">입찰</option>
                      <option value="수의계약">수의계약</option>
                    </select>
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">주사업자</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.mainContractor}
                      onChange={(e) => setVrbData({ ...vrbData, mainContractor: e.target.value })}
                      placeholder="예: (주)위엠비"
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors placeholder-gray-400"
                    />
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">주요 도입 솔루션</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.keySolutions}
                      onChange={(e) => setVrbData({ ...vrbData, keySolutions: e.target.value })}
                      placeholder="예: RENOBIT, TIM"
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors placeholder-gray-400"
                    />
                  </td>
                </tr>

                {/* Row 6: Partners (2), Partner Info (2), Competitors (2) */}
                <tr className="border-b border-gray-300 h-[35px]">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">파트너사</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.partners}
                      onChange={(e) => setVrbData({ ...vrbData, partners: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                    />
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">파트너사 정보</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.partnerInfo}
                      onChange={(e) => setVrbData({ ...vrbData, partnerInfo: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                    />
                  </td>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 leading-tight">경쟁사</th>
                  <td className="border border-gray-300 p-0 h-[35px]">
                    <input
                      type="text"
                      value={vrbData.competitors}
                      onChange={(e) => setVrbData({ ...vrbData, competitors: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full h-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none hover:bg-blue-50 transition-colors"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 align-top pt-[10px] leading-tight">사업배경</th>
                  <td className="border border-gray-300 p-0 h-1" colSpan={5}>
                    <textarea
                      value={vrbData.businessBackground}
                      onChange={(e) => setVrbData({ ...vrbData, businessBackground: e.target.value })}
                      onMouseUp={(e: any) => handleHeightChange('businessBackground', e.target.offsetHeight)}
                      style={{ height: vrbData.uiSettings?.heights?.['businessBackground'] ? `${vrbData.uiSettings.heights['businessBackground']}px` : undefined }}
                      rows={4}
                      disabled={isReadOnly}
                      className="w-full h-full border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y text-sm bg-transparent p-[10px] hover:bg-blue-50 transition-colors rounded-none outline-none block"
                      placeholder="사업배경을 입력하세요"
                    />
                  </td>
                </tr>

                {/* Row 8 - Business Scope */}
                <tr className="border-b border-gray-300">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 align-top pt-[10px] leading-tight">사업범위</th>
                  <td className="border border-gray-300 p-0 h-1" colSpan={5}>
                    <textarea
                      value={vrbData.businessScope}
                      onChange={(e) => setVrbData({ ...vrbData, businessScope: e.target.value })}
                      onMouseUp={(e: any) => handleHeightChange('businessScope', e.target.offsetHeight)}
                      style={{ height: vrbData.uiSettings?.heights?.['businessScope'] ? `${vrbData.uiSettings.heights['businessScope']}px` : undefined }}
                      rows={4}
                      disabled={isReadOnly}
                      className="w-full h-full border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y text-sm bg-transparent p-[10px] hover:bg-blue-50 transition-colors rounded-none outline-none block"
                      placeholder="사업범위를 입력하세요"
                    />
                  </td>
                </tr>

                {/* Row 9 - Major Contents */}
                <tr className="border-b border-gray-300">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 align-top pt-[10px] leading-tight">주요내용</th>
                  <td className="border border-gray-300 p-0" colSpan={5}>
                    <div className="flex flex-col">
                      {vrbData.keyContents.map((content, index) => (
                        <div key={index} className="flex items-stretch border-b border-gray-300 last:border-0 min-h-[35px]">
                          <div className="w-[130px] border-r border-gray-300">
                            <DatePicker
                              date={content.date ? new Date(content.date) : undefined}
                              setDate={(date) => handleContentChange(index, "date", date ? format(date, "yyyy-MM-dd") : "")}
                              disabled={isReadOnly}
                              className="w-full h-full"
                              buttonClassName="border-none shadow-none w-full h-full rounded-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 transition-colors justify-center px-0"
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                          <div className="flex-1 relative">
                            <textarea
                              value={content.content}
                              onChange={(e) => handleContentChange(index, "content", e.target.value)}
                              onMouseUp={(e: any) => handleContentHeightChange(index, e.target.offsetHeight)}
                              style={{ height: content.ui_height ? `${content.ui_height}px` : '35px' }}
                              rows={1}
                              placeholder="내용을 입력하세요"
                              disabled={isReadOnly}
                              className="w-full h-full border-none px-[10px] py-[6px] text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y bg-transparent hover:bg-blue-50 transition-colors rounded-none outline-none leading-relaxed block overflow-hidden"
                            />
                          </div>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveContent(index)}
                              className="w-[40px] flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {vrbData.keyContents.length === 0 && (
                        <div className="flex h-[35px] items-center justify-center border-b border-gray-300 text-sm text-gray-400">
                          내용이 없습니다.
                        </div>
                      )}
                      {!isReadOnly && (
                        <button
                          onClick={handleAddContent}
                          className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-none text-sm rounded-none"
                        >
                          <Plus className="h-3 w-3" /> 내용 추가
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Row 10 - Major Activities */}
                <tr className="border-b border-gray-300">
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 align-top pt-[10px] whitespace-nowrap">주요활동</th>
                  <td className="border border-gray-300 p-0" colSpan={5}>
                    <div className="flex flex-col">
                      {vrbData.keyActivities.map((activity, index) => (
                        <div key={index} className="flex items-stretch border-b border-gray-300 last:border-0 min-h-[35px]">
                          <div className="w-[130px] border-r border-gray-300">
                            <DatePicker
                              date={activity.date ? new Date(activity.date) : undefined}
                              setDate={(date) => handleActivityChange(index, "date", date ? format(date, "yyyy-MM-dd") : "")}
                              disabled={isReadOnly}
                              className="w-full h-full"
                              buttonClassName="border-none shadow-none w-full h-full rounded-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 transition-colors justify-center px-0"
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                          <div className="flex-1 relative">
                            <textarea
                              value={activity.activity}
                              onChange={(e) => handleActivityChange(index, "activity", e.target.value)}
                              onMouseUp={(e: any) => handleActivityHeightChange(index, e.target.offsetHeight)}
                              style={{ height: activity.ui_height ? `${activity.ui_height}px` : '35px' }}
                              rows={1}
                              placeholder="활동을 입력하세요"
                              disabled={isReadOnly}
                              className="w-full h-full border-none px-[10px] py-[6px] text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y bg-transparent hover:bg-blue-50 transition-colors rounded-none outline-none leading-relaxed block overflow-hidden"
                            />
                          </div>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveActivity(index)}
                              className="w-[40px] flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {vrbData.keyActivities.length === 0 && (
                        <div className="flex h-[35px] items-center justify-center border-b border-gray-300 text-sm text-gray-400">
                          활동 내역이 없습니다.
                        </div>
                      )}
                      {!isReadOnly && (
                        <button
                          onClick={handleAddActivity}
                          className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-none text-sm rounded-none"
                        >
                          <Plus className="h-3 w-3" /> 활동 추가
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Row 11 - Risk */}
                <tr>
                  <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left font-bold text-gray-900 align-top pt-[10px] whitespace-nowrap">Risk</th>
                  <td className="border border-gray-300 p-0 h-1" colSpan={5}>
                    <textarea
                      value={vrbData.risk}
                      onChange={(e) => setVrbData({ ...vrbData, risk: e.target.value })}
                      onMouseUp={(e: any) => handleHeightChange('risk', e.target.offsetHeight)}
                      style={{ height: vrbData.uiSettings?.heights?.['risk'] ? `${vrbData.uiSettings.heights['risk']}px` : undefined }}
                      rows={3}
                      placeholder="Risk를 입력하세요"
                      disabled={isReadOnly}
                      className="w-full h-full border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y text-sm bg-transparent p-[10px] hover:bg-blue-50 transition-colors rounded-none outline-none block"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. 사전 수지분석서 요약 */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">2. 사전 수지분석서 요약</h2>

          {/* 기본 필드 표 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-none shadow-none text-sm table-fixed min-w-[1000px]">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
                <col className="w-[15.5%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
                <col className="w-[15.5%]" />
              </colgroup>
              <thead>
                <tr className="bg-blue-50/50 h-[35px]">
                  <th className="border border-gray-300 px-[10px] text-left font-bold text-gray-900">항목</th>
                  <th colSpan={3} className="border-t-2 border-x-2 border-blue-400 border-b border-gray-300 px-[10px] text-center font-bold text-blue-700 bg-blue-50" style={{ borderTopColor: '#60a5fa', borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>Best Case</th>
                  <th colSpan={3} className="border border-gray-300 px-[10px] text-center font-bold text-gray-700">Worst Case</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* 예상 수주 금액 (SW,물품) */}
                <tr className="h-[35px]">
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">예상 수주 금액 (SW,물품)</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 hover:bg-blue-50/50 transition-colors h-[35px]" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <input
                      type="text"
                      value={numberInputValues["best-estimatedRevenueGoods"] !== undefined
                        ? numberInputValues["best-estimatedRevenueGoods"]
                        : formatNumberWithCommas(vrbData.bestCase.estimatedRevenueGoods)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueGoods"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueGoods: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueGoods: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["best-estimatedRevenueGoods"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueGoods);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueGoods"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50 rounded-none"
                    />
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 hover:bg-blue-50/50 transition-colors h-[35px]">
                    <input
                      type="text"
                      value={numberInputValues["worst-estimatedRevenueGoods"] !== undefined
                        ? numberInputValues["worst-estimatedRevenueGoods"]
                        : formatNumberWithCommas(vrbData.worstCase.estimatedRevenueGoods)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueGoods"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueGoods: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueGoods: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["worst-estimatedRevenueGoods"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueGoods);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueGoods"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50 rounded-none"
                    />
                  </td>
                </tr>

                {/* 예상 수주 금액 (HW) */}
                <tr className="h-[35px]">
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">예상 수주 금액 (HW)</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 hover:bg-blue-50/50 transition-colors h-[35px]" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <input
                      type="text"
                      value={numberInputValues["best-estimatedRevenueHw"] !== undefined
                        ? numberInputValues["best-estimatedRevenueHw"]
                        : formatNumberWithCommas(vrbData.bestCase.estimatedRevenueHw)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueHw"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueHw: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueHw: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["best-estimatedRevenueHw"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueHw);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueHw"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50 rounded-none"
                    />
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 hover:bg-blue-50/50 transition-colors h-[35px]">
                    <input
                      type="text"
                      value={numberInputValues["worst-estimatedRevenueHw"] !== undefined
                        ? numberInputValues["worst-estimatedRevenueHw"]
                        : formatNumberWithCommas(vrbData.worstCase.estimatedRevenueHw)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueHw"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueHw: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueHw: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["worst-estimatedRevenueHw"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueHw);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueHw"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50 rounded-none"
                    />
                  </td>
                </tr>

                {/* 예상 수주 금액 (용역) */}
                <tr className="h-[35px]">
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">예상 수주 금액 (용역)</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 hover:bg-blue-50/50 transition-colors h-[35px]" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <input
                      type="text"
                      value={numberInputValues["best-estimatedRevenueServices"] !== undefined
                        ? numberInputValues["best-estimatedRevenueServices"]
                        : formatNumberWithCommas(vrbData.bestCase.estimatedRevenueServices)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueServices"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueServices: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, bestCase: { ...vrbData.bestCase, estimatedRevenueServices: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["best-estimatedRevenueServices"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueServices);
                        setNumberInputValues(prev => ({ ...prev, ["best-estimatedRevenueServices"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50 rounded-none"
                    />
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 hover:bg-blue-50/50 transition-colors h-[35px]">
                    <input
                      type="text"
                      value={numberInputValues["worst-estimatedRevenueServices"] !== undefined
                        ? numberInputValues["worst-estimatedRevenueServices"]
                        : formatNumberWithCommas(vrbData.worstCase.estimatedRevenueServices)
                      }
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                        const formattedValue = addCommasToNumber(inputValue);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueServices"]: formattedValue }));
                        const numValue = parseNumberFromString(formattedValue);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueServices: numValue } });
                      }}
                      onBlur={(e) => {
                        const numValue = parseNumberFromString(e.target.value);
                        setVrbData({ ...vrbData, worstCase: { ...vrbData.worstCase, estimatedRevenueServices: numValue } });
                        setNumberInputValues(prev => {
                          const newState = { ...prev };
                          delete newState["worst-estimatedRevenueServices"];
                          return newState;
                        });
                      }}
                      onFocus={() => {
                        const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueServices);
                        setNumberInputValues(prev => ({ ...prev, ["worst-estimatedRevenueServices"]: currentValue }));
                      }}
                      className="block w-full h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50"
                    />
                  </td>
                </tr>

                {/* 예상 수주 금액 (합계) */}
                <tr className="h-[35px] bg-gray-50/50 font-bold">
                  <td className="border border-gray-300 px-[10px] text-gray-900 bg-gray-50/50">예상 수주 금액 (합계)</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid px-[10px] text-right text-blue-700 bg-blue-50/20" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    {formatCurrency(
                      vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw,
                      "KRW"
                    )}
                  </td>
                  <td colSpan={3} className="border border-gray-300 px-[10px] text-right text-gray-900 bg-gray-50/30">
                    {formatCurrency(
                      vrbData.worstCase.estimatedRevenueGoods + vrbData.worstCase.estimatedRevenueServices + vrbData.worstCase.estimatedRevenueHw,
                      "KRW"
                    )}
                  </td>
                </tr>

                {/* 타사 상품 매입 */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">타사 상품 매입</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 align-top" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <div className="flex flex-col w-full">
                      {vrbData.bestCase.otherGoodsItems.map((item, index) => (
                        <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleOtherGoodsChange("best", index, "item", e.target.value)}
                            placeholder="항목"
                            className="flex-1 h-full border-none bg-white px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          <div className="w-[1px] h-full bg-gray-300"></div>
                          <input
                            type="text"
                            value={numberInputValues[`best-otherGoods-${index}`] !== undefined
                              ? numberInputValues[`best-otherGoods-${index}`]
                              : formatNumberWithCommas(item.amount)
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                              const formattedValue = addCommasToNumber(inputValue);
                              setNumberInputValues(prev => ({ ...prev, [`best-otherGoods-${index}`]: formattedValue }));
                              const numValue = parseNumberFromString(formattedValue);
                              handleOtherGoodsChange("best", index, "amount", numValue);
                            }}
                            onBlur={() => {
                              setNumberInputValues(prev => {
                                const newState = { ...prev };
                                delete newState[`best-otherGoods-${index}`];
                                return newState;
                              });
                            }}
                            onFocus={() => {
                              const currentValue = formatNumberWithCommas(item.amount);
                              setNumberInputValues(prev => ({ ...prev, [`best-otherGoods-${index}`]: currentValue }));
                            }}
                            placeholder="금액"
                            className="w-32 h-full border-none bg-white px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          {!isReadOnly && (
                            <button onClick={() => handleOtherGoodsRemove("best", index)} className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isReadOnly && (
                        <button onClick={() => handleOtherGoodsAdd("best")} className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-none text-sm rounded-none">
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                    </div>
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 align-top">
                    <div className="flex flex-col w-full">
                      {vrbData.worstCase.otherGoodsItems.map((item, index) => (
                        <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                          <input
                            type="text"
                            value={item.item}
                            onChange={(e) => handleOtherGoodsChange("worst", index, "item", e.target.value)}
                            placeholder="항목"
                            className="flex-1 h-full border-none bg-transparent px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          <div className="w-[1px] h-full bg-gray-300"></div>
                          <input
                            type="text"
                            value={numberInputValues[`worst-otherGoods-${index}`] !== undefined
                              ? numberInputValues[`worst-otherGoods-${index}`]
                              : formatNumberWithCommas(item.amount)
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                              const formattedValue = addCommasToNumber(inputValue);
                              setNumberInputValues(prev => ({ ...prev, [`worst-otherGoods-${index}`]: formattedValue }));
                              const numValue = parseNumberFromString(formattedValue);
                              handleOtherGoodsChange("worst", index, "amount", numValue);
                            }}
                            onBlur={() => {
                              setNumberInputValues(prev => {
                                const newState = { ...prev };
                                delete newState[`worst-otherGoods-${index}`];
                                return newState;
                              });
                            }}
                            onFocus={() => {
                              const currentValue = formatNumberWithCommas(item.amount);
                              setNumberInputValues(prev => ({ ...prev, [`worst-otherGoods-${index}`]: currentValue }));
                            }}
                            placeholder="금액"
                            className="w-32 h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          {!isReadOnly && (
                            <button onClick={() => handleOtherGoodsRemove("worst", index)} className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isReadOnly && (
                        <button onClick={() => handleOtherGoodsAdd("worst")} className="w-full h-[35px] flex items-center justify-center gap-1 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border-none text-sm rounded-none">
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 프로젝트 수행 비용 */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">프로젝트 수행 비용</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 align-top" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <div className="flex flex-col w-full">
                      {vrbData.bestCase.projectCosts.map((cost, index) => (
                        <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                          <input
                            type="text"
                            value={cost.item}
                            onChange={(e) => handleProjectCostChange("best", index, "item", e.target.value)}
                            placeholder="항목"
                            className="flex-1 h-full border-none bg-transparent px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          <div className="w-[1px] h-full bg-gray-300"></div>
                          <input
                            type="text"
                            value={numberInputValues[`best-projectCost-${index}`] !== undefined
                              ? numberInputValues[`best-projectCost-${index}`]
                              : formatNumberWithCommas(cost.amount)
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                              const formattedValue = addCommasToNumber(inputValue);
                              setNumberInputValues(prev => ({ ...prev, [`best-projectCost-${index}`]: formattedValue }));
                              const numValue = parseNumberFromString(formattedValue);
                              handleProjectCostChange("best", index, "amount", numValue);
                            }}
                            onBlur={() => {
                              setNumberInputValues(prev => {
                                const newState = { ...prev };
                                delete newState[`best-projectCost-${index}`];
                                return newState;
                              });
                            }}
                            onFocus={() => {
                              const currentValue = formatNumberWithCommas(cost.amount);
                              setNumberInputValues(prev => ({ ...prev, [`best-projectCost-${index}`]: currentValue }));
                            }}
                            placeholder="금액"
                            className="w-32 h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          {!isReadOnly && (
                            <button onClick={() => handleRemoveProjectCost("best", index)} className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isReadOnly && (
                        <button onClick={() => handleAddProjectCost("best")} className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-none text-sm rounded-none">
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                    </div>
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 align-top">
                    <div className="flex flex-col w-full">
                      {vrbData.worstCase.projectCosts.map((cost, index) => (
                        <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                          <input
                            type="text"
                            value={cost.item}
                            onChange={(e) => handleProjectCostChange("worst", index, "item", e.target.value)}
                            placeholder="항목"
                            className="flex-1 h-full border-none bg-transparent px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          <div className="w-[1px] h-full bg-gray-300"></div>
                          <input
                            type="text"
                            value={numberInputValues[`worst-projectCost-${index}`] !== undefined
                              ? numberInputValues[`worst-projectCost-${index}`]
                              : formatNumberWithCommas(cost.amount)
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                              const formattedValue = addCommasToNumber(inputValue);
                              setNumberInputValues(prev => ({ ...prev, [`worst-projectCost-${index}`]: formattedValue }));
                              const numValue = parseNumberFromString(formattedValue);
                              handleProjectCostChange("worst", index, "amount", numValue);
                            }}
                            onBlur={() => {
                              setNumberInputValues(prev => {
                                const newState = { ...prev };
                                delete newState[`worst-projectCost-${index}`];
                                return newState;
                              });
                            }}
                            onFocus={() => {
                              const currentValue = formatNumberWithCommas(cost.amount);
                              setNumberInputValues(prev => ({ ...prev, [`worst-projectCost-${index}`]: currentValue }));
                            }}
                            placeholder="금액"
                            className="w-32 h-full border-none bg-transparent px-[10px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                          />
                          {!isReadOnly && (
                            <button onClick={() => handleRemoveProjectCost("worst", index)} className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isReadOnly && (
                        <button onClick={() => handleAddProjectCost("worst")} className="w-full h-[35px] flex items-center justify-center gap-1 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border-none text-sm rounded-none">
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 예상 M/M */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-sm font-medium text-gray-700 bg-gray-50/30">예상 M/M</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 border-solid p-0 align-top" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    <div className="flex flex-col w-full">
                      {vrbData.bestCase.estimatedMmItems.length === 0 && vrbData.bestCase.estimatedMm === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 h-[35px] px-[10px] border-b border-gray-300 bg-gray-50/30">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">M/D 산정을 먼저 진행해주세요.</p>
                          <Link
                            href={`/projects/${id}/md-estimation`}
                            className="text-sm font-medium underline hover:text-amber-700"
                          >
                            M/D 산정으로 이동
                          </Link>
                        </div>
                      )}
                      {vrbData.bestCase.estimatedMmItems.map((mmItem, index) => {
                        return (
                          <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                            <input
                              type="text"
                              value={mmItem.item}
                              onChange={(e) => handleEstimatedMmChange("best", index, "item", e.target.value)}
                              className="flex-1 h-full border-none bg-white px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                              placeholder="항목"
                              spellCheck={false}
                            />
                            <div className="w-[1px] h-full bg-gray-300"></div>
                            <div className="relative w-32 h-full shrink-0">
                              <input
                                type="text"
                                value={mmInputValues[`best-${index}`] !== undefined
                                  ? mmInputValues[`best-${index}`]
                                  : mmItem.mm.toFixed(2)
                                }
                                onChange={(e) => {
                                  const inputValue = e.target.value.replace(/[^0-9.]/g, "");
                                  setMmInputValues(prev => ({
                                    ...prev,
                                    [`best-${index}`]: inputValue
                                  }));
                                  if (inputValue === "" || inputValue === ".") {
                                    handleEstimatedMmChange("best", index, "mm", 0);
                                    return;
                                  }
                                  const firstDotIndex = inputValue.indexOf(".");
                                  let normalizedValue = inputValue;
                                  if (firstDotIndex !== -1) {
                                    const beforeDot = inputValue.substring(0, firstDotIndex + 1);
                                    const afterDot = inputValue.substring(firstDotIndex + 1).replace(/\./g, "");
                                    normalizedValue = beforeDot + afterDot;
                                  }
                                  const value = parseFloat(normalizedValue);
                                  if (!isNaN(value)) {
                                    handleEstimatedMmChange("best", index, "mm", value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  const formattedValue = parseFloat(value.toFixed(2));
                                  handleEstimatedMmChange("best", index, "mm", formattedValue);
                                  setMmInputValues(prev => {
                                    const newState = { ...prev };
                                    delete newState[`best-${index}`];
                                    return newState;
                                  });
                                }}
                                onFocus={() => {
                                  const currentValue = mmItem.mm.toFixed(2);
                                  setMmInputValues(prev => ({
                                    ...prev,
                                    [`best-${index}`]: currentValue
                                  }));
                                }}
                                className="w-full h-full border-none bg-white pl-[10px] pr-[42px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                                placeholder="M/M"
                              />
                              <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">M/M</span>
                            </div>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleRemoveEstimatedMm("best", index)}
                                className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!isReadOnly && (
                        <button
                          onClick={() => handleAddEstimatedMm("best")}
                          className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-b border-gray-300 last:border-0 text-sm rounded-none"
                        >
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                      {vrbData.bestCase.estimatedMmItems.length > 0 && (
                        <div className="bg-gray-50/50 h-[35px] px-[10px] flex items-center justify-end">
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-900">
                              합계: {formatCurrency(
                                vrbData.bestCase.estimatedMmItems.reduce((sum, item) => sum + (item.mm * 10000000), 0),
                                "KRW"
                              )}
                            </p>
                            <div className="group relative">
                              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-normal">
                                1 M/M당 1,000만원으로 산정된 예상치입니다.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td colSpan={3} className="border border-gray-300 p-0 align-top">
                    <div className="flex flex-col w-full">
                      {vrbData.worstCase.estimatedMmItems.length === 0 ? (
                        <div className="flex h-[35px] items-center justify-center text-sm text-gray-400 border-b border-gray-300">-</div>
                      ) : (
                        vrbData.worstCase.estimatedMmItems.map((mmItem, index) => {
                          return (
                            <div key={index} className="flex items-center border-b border-gray-300 last:border-0 h-[35px]">
                              <input
                                type="text"
                                value={mmItem.item}
                                onChange={(e) => handleEstimatedMmChange("worst", index, "item", e.target.value)}
                                className="flex-1 h-full border-none bg-transparent px-[10px] py-0 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                                placeholder="항목명"
                                spellCheck={false}
                              />
                              <div className="w-[1px] h-full bg-gray-300"></div>
                              <div className="relative w-32 h-full shrink-0">
                                <input
                                  type="text"
                                  value={mmInputValues[`worst-${index}`] !== undefined
                                    ? mmInputValues[`worst-${index}`]
                                    : mmItem.mm.toFixed(2)
                                  }
                                  onChange={(e) => {
                                    const inputValue = e.target.value.replace(/[^0-9.]/g, "");
                                    setMmInputValues(prev => ({
                                      ...prev,
                                      [`worst-${index}`]: inputValue
                                    }));
                                    if (inputValue === "" || inputValue === ".") {
                                      handleEstimatedMmChange("worst", index, "mm", 0);
                                      return;
                                    }
                                    const firstDotIndex = inputValue.indexOf(".");
                                    let normalizedValue = inputValue;
                                    if (firstDotIndex !== -1) {
                                      const beforeDot = inputValue.substring(0, firstDotIndex + 1);
                                      const afterDot = inputValue.substring(firstDotIndex + 1).replace(/\./g, "");
                                      normalizedValue = beforeDot + afterDot;
                                    }
                                    const value = parseFloat(normalizedValue);
                                    if (!isNaN(value)) {
                                      handleEstimatedMmChange("worst", index, "mm", value);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    const formattedValue = parseFloat(value.toFixed(2));
                                    handleEstimatedMmChange("worst", index, "mm", formattedValue);
                                    setMmInputValues(prev => {
                                      const newState = { ...prev };
                                      delete newState[`worst-${index}`];
                                      return newState;
                                    });
                                  }}
                                  onFocus={(e) => {
                                    const currentValue = mmItem.mm.toFixed(2);
                                    setMmInputValues(prev => ({
                                      ...prev,
                                      [`worst-${index}`]: currentValue
                                    }));
                                  }}
                                  className="w-full h-full border-none bg-transparent pl-[10px] pr-[42px] py-0 text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                                  placeholder="M/M"
                                />
                                <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">M/M</span>
                              </div>
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleRemoveEstimatedMm("worst", index)}
                                  className="w-[35px] h-full flex items-center justify-center border-l border-gray-300 text-gray-400 hover:text-red-600 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                      {!isReadOnly && (
                        <button
                          onClick={() => handleAddEstimatedMm("worst")}
                          className="w-full h-[35px] flex items-center justify-center gap-1 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-300 last:border-0 text-sm rounded-none"
                        >
                          <Plus className="h-3 w-3" /> 항목 추가
                        </button>
                      )}
                      {vrbData.worstCase.estimatedMmItems.length > 0 && (
                        <div className="bg-gray-50/50 h-[35px] px-[10px] flex items-center justify-end">
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-900">
                              합계: {formatCurrency(
                                vrbData.worstCase.estimatedMmItems.reduce((sum, item) => sum + (item.mm * 10000000), 0),
                                "KRW"
                              )}
                            </p>
                            <div className="group relative">
                              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-normal">
                                1 M/M당 1,000만원으로 산정된 예상치입니다.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 리스크 비용 */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">리스크 비용</td>
                  <td className="border-l-2 border-y border-blue-400 border-solid p-0" style={{ borderLeftColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <select
                      value={vrbData.bestCase.riskCostBase}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            riskCostBase: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly}
                      className="w-full h-[35px] border-none px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none"
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                    </select>
                  </td>
                  <td className="border-y border-gray-300 p-0 group">
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.bestCase.riskCostPercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              riskCostPercent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly}
                        className="w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                        placeholder="%"
                      />
                      <span className="text-sm text-gray-500 px-1">%</span>
                    </div>
                  </td>
                  <td className="border-r-2 border-y border-blue-400 border-solid px-[10px] text-right bg-gray-50/20" style={{ borderRightColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw;
                          if (vrbData.bestCase.riskCostBase === "revenue_sw") baseValue = vrbData.bestCase.estimatedRevenueGoods;
                          else if (vrbData.bestCase.riskCostBase === "revenue_hw") baseValue = vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.riskCostBase === "revenue_service") baseValue = vrbData.bestCase.estimatedRevenueServices;
                          else if (vrbData.bestCase.riskCostBase === "operating_profit") baseValue = 0; // TBD logic
                          return (baseValue * vrbData.bestCase.riskCostPercent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-0">
                    <select
                      value={vrbData.worstCase.riskCostBase}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            riskCostBase: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly}
                      className="w-full h-[35px] border-none px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none"
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 p-0 group">
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.worstCase.riskCostPercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            worstCase: {
                              ...vrbData.worstCase,
                              riskCostPercent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly}
                        className="w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400"
                        placeholder="%"
                      />
                      <span className="text-sm text-gray-500 px-1">%</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-[10px] text-right bg-gray-50/20">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.worstCase.estimatedRevenueGoods + vrbData.worstCase.estimatedRevenueServices + vrbData.worstCase.estimatedRevenueHw;
                          if (vrbData.worstCase.riskCostBase === "revenue_sw") baseValue = vrbData.worstCase.estimatedRevenueGoods;
                          else if (vrbData.worstCase.riskCostBase === "revenue_hw") baseValue = vrbData.worstCase.estimatedRevenueHw;
                          else if (vrbData.worstCase.riskCostBase === "revenue_service") baseValue = vrbData.worstCase.estimatedRevenueServices;
                          else if (vrbData.worstCase.riskCostBase === "operating_profit") baseValue = 0;
                          return (baseValue * vrbData.worstCase.riskCostPercent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                </tr>

                {/* 외부 매입1 */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium h-[35px] bg-gray-50/30">
                    <div className="flex items-center gap-2 h-full">
                      <span>외부 매입1</span>
                      <input
                        type="checkbox"
                        checked={vrbData.bestCase.includeExternalPurchase}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              includeExternalPurchase: isChecked,
                              includeExternalPurchase2: isChecked ? vrbData.bestCase.includeExternalPurchase2 : false,
                            },
                            worstCase: {
                              ...vrbData.worstCase,
                              includeExternalPurchase: isChecked,
                              includeExternalPurchase2: isChecked ? vrbData.worstCase.includeExternalPurchase2 : false,
                            },
                          });
                        }}
                        disabled={isReadOnly}
                        className={cn(
                          "h-4 w-4 rounded-none border-gray-300 text-blue-600 focus:ring-blue-500",
                          isReadOnly ? "opacity-50 cursor-default" : ""
                        )}
                      />
                    </div>
                  </td>
                  <td className={`border-l-2 border-y border-blue-400 border-solid p-0 ${!vrbData.bestCase.includeExternalPurchase ? 'bg-gray-50' : ''}`} style={{ borderLeftColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <select
                      value={vrbData.bestCase.externalPurchaseBase}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            externalPurchaseBase: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase}
                      className={cn(
                        "w-full h-[35px] border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none disabled:opacity-100",
                        vrbData.bestCase.includeExternalPurchase ? "text-gray-900 font-medium" : "text-gray-400"
                      )}
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                      <option value="operating_profit_ep1">영업이익(외부매입1 반영)</option>
                    </select>
                  </td>
                  <td className={`border-y border-gray-300 p-0 group ${!vrbData.bestCase.includeExternalPurchase ? 'bg-gray-50' : ''}`}>
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.bestCase.externalPurchasePercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              externalPurchasePercent: (parseFloat(e.target.value) || 0) + 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase}
                        className={cn(
                          "w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400 disabled:bg-transparent disabled:opacity-100",
                          vrbData.bestCase.includeExternalPurchase ? "text-gray-900 font-medium" : "text-gray-400"
                        )}
                        placeholder="%"
                      />
                      <span className={cn("text-sm px-1", vrbData.bestCase.includeExternalPurchase ? "text-gray-700" : "text-gray-400")}>%</span>
                    </div>
                  </td>
                  <td className={`border-r-2 border-y border-blue-400 border-solid px-[10px] text-right ${!vrbData.bestCase.includeExternalPurchase ? 'bg-gray-50' : 'bg-gray-50/20'}`} style={{ borderRightColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <span className="text-sm text-gray-900 font-bold">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.bestCase.operatingProfit1;
                          if (vrbData.bestCase.externalPurchaseBase === "total_revenue") baseValue = vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.externalPurchaseBase === "revenue_sw") baseValue = vrbData.bestCase.estimatedRevenueGoods;
                          else if (vrbData.bestCase.externalPurchaseBase === "revenue_hw") baseValue = vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.externalPurchaseBase === "revenue_service") baseValue = vrbData.bestCase.estimatedRevenueServices;

                          if (vrbData.bestCase.externalPurchaseBase === "operating_profit_ep1") {
                            return (baseValue * vrbData.bestCase.externalPurchasePercent) / (100 + vrbData.bestCase.externalPurchasePercent);
                          }
                          return (baseValue * vrbData.bestCase.externalPurchasePercent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                  <td className={`border border-gray-300 p-0 ${!vrbData.worstCase.includeExternalPurchase ? 'bg-gray-50' : ''}`}>
                    <select
                      value={vrbData.worstCase.externalPurchaseBase}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            externalPurchaseBase: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase}
                      className={cn(
                        "w-full h-[35px] border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none disabled:opacity-100",
                        vrbData.worstCase.includeExternalPurchase ? "text-gray-900 font-medium" : "text-gray-400"
                      )}
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                      <option value="operating_profit_ep1">영업이익(외부매입1 반영)</option>
                    </select>
                  </td>
                  <td className={`border border-gray-300 p-0 group ${!vrbData.worstCase.includeExternalPurchase ? 'bg-gray-50' : ''}`}>
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.worstCase.externalPurchasePercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            worstCase: {
                              ...vrbData.worstCase,
                              externalPurchasePercent: (parseFloat(e.target.value) || 0) + 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase}
                        className={cn(
                          "w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400 disabled:bg-transparent disabled:opacity-100",
                          vrbData.worstCase.includeExternalPurchase ? "text-gray-900 font-medium" : "text-gray-400"
                        )}
                        placeholder="%"
                      />
                      <span className={cn("text-sm px-1", vrbData.worstCase.includeExternalPurchase ? "text-gray-700" : "text-gray-400")}>%</span>
                    </div>
                  </td>
                  <td className={`border border-gray-300 px-[10px] text-right ${!vrbData.worstCase.includeExternalPurchase ? 'bg-gray-50' : 'bg-gray-50/20'}`}>
                    <span className="text-sm text-gray-900 font-bold">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.worstCase.operatingProfit1;
                          if (vrbData.worstCase.externalPurchaseBase === "total_revenue") baseValue = vrbData.worstCase.estimatedRevenueGoods + vrbData.worstCase.estimatedRevenueServices + vrbData.worstCase.estimatedRevenueHw;
                          else if (vrbData.worstCase.externalPurchaseBase === "revenue_sw") baseValue = vrbData.worstCase.estimatedRevenueGoods;
                          else if (vrbData.worstCase.externalPurchaseBase === "revenue_hw") baseValue = vrbData.worstCase.estimatedRevenueHw;
                          else if (vrbData.worstCase.externalPurchaseBase === "revenue_service") baseValue = vrbData.worstCase.estimatedRevenueServices;

                          if (vrbData.worstCase.externalPurchaseBase === "operating_profit_ep1") {
                            return (baseValue * vrbData.worstCase.externalPurchasePercent) / (100 + vrbData.worstCase.externalPurchasePercent);
                          }
                          return (baseValue * vrbData.worstCase.externalPurchasePercent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                </tr>

                {/* 외부 매입2 */}
                <tr>
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium h-[35px] bg-gray-50/30">
                    <div className="flex items-center gap-2 h-full">
                      <span>외부 매입2</span>
                      <input
                        type="checkbox"
                        checked={vrbData.bestCase.includeExternalPurchase2}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              includeExternalPurchase2: e.target.checked,
                            },
                            worstCase: {
                              ...vrbData.worstCase,
                              includeExternalPurchase2: e.target.checked,
                            },
                          })
                        }
                        className={cn(
                          "h-4 w-4 rounded-none border-gray-300 text-blue-600 focus:ring-blue-500",
                          isReadOnly ? "opacity-50 cursor-default" : (!vrbData.bestCase.includeExternalPurchase ? "opacity-50 cursor-not-allowed" : "")
                        )}
                        disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase}
                        title={(!isReadOnly && !vrbData.bestCase.includeExternalPurchase) ? "외부 매입1을 먼저 선택해야 합니다." : ""}
                      />
                    </div>
                  </td>
                  <td className={`border-l-2 border-y border-blue-400 border-solid p-0 ${(!vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2) ? 'bg-gray-50' : ''}`} style={{ borderLeftColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <select
                      value={vrbData.bestCase.externalPurchase2Base}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            externalPurchase2Base: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2}
                      className={cn(
                        "w-full h-[35px] border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none disabled:opacity-100",
                        vrbData.bestCase.includeExternalPurchase2 ? "text-gray-900 font-medium" : "text-gray-400"
                      )}
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                      <option value="operating_profit_ep1">영업이익(외부매입1 반영)</option>
                    </select>
                  </td>
                  <td className={`border-y border-gray-300 p-0 group ${(!vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2) ? 'bg-gray-50' : ''}`}>
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.bestCase.externalPurchase2Percent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              externalPurchase2Percent: (parseFloat(e.target.value) || 0) + 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2}
                        className={cn(
                          "w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400 disabled:bg-transparent disabled:opacity-100",
                          vrbData.bestCase.includeExternalPurchase2 ? "text-gray-900 font-medium" : "text-gray-400"
                        )}
                        placeholder="%"
                      />
                      <span className={cn("text-sm px-1", vrbData.bestCase.includeExternalPurchase2 ? "text-gray-700" : "text-gray-500")}>%</span>
                    </div>
                  </td>
                  <td className={`border-r-2 border-y border-blue-400 border-solid px-[10px] text-right ${(!vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2) ? 'bg-gray-50' : 'bg-gray-50/20'}`} style={{ borderRightColor: '#60a5fa', borderTopColor: '#d1d5db', borderBottomColor: '#d1d5db' }}>
                    <span className="text-sm text-gray-900 font-bold">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.bestCase.operatingProfit1;
                          if (vrbData.bestCase.externalPurchase2Base === "total_revenue") baseValue = vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.externalPurchase2Base === "revenue_sw") baseValue = vrbData.bestCase.estimatedRevenueGoods;
                          else if (vrbData.bestCase.externalPurchase2Base === "revenue_hw") baseValue = vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.externalPurchase2Base === "revenue_service") baseValue = vrbData.bestCase.estimatedRevenueServices;
                          else if (vrbData.bestCase.externalPurchase2Base === "operating_profit_ep1") baseValue = vrbData.bestCase.operatingProfitEP1;
                          return (baseValue * vrbData.bestCase.externalPurchase2Percent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                  <td className={`border border-gray-300 p-0 ${(!vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2) ? 'bg-gray-50' : ''}`}>
                    <select
                      value={vrbData.worstCase.externalPurchase2Base}
                      onChange={(e) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            externalPurchase2Base: e.target.value,
                          },
                        })
                      }
                      disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2}
                      className={cn(
                        "w-full h-[35px] border-none px-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-none bg-transparent hover:bg-blue-50 transition-colors appearance-none disabled:opacity-100",
                        vrbData.worstCase.includeExternalPurchase2 ? "text-gray-900 font-medium" : "text-gray-400"
                      )}
                    >
                      <option value="total_revenue">전체 사업비</option>
                      <option value="revenue_sw">예상 수주 금액 (SW)</option>
                      <option value="revenue_hw">예상 수주 금액 (HW)</option>
                      <option value="revenue_service">예상 수주 금액 (용역)</option>
                      <option value="operating_profit">영업이익</option>
                      <option value="operating_profit_ep1">영업이익(외부매입1 반영)</option>
                    </select>
                  </td>
                  <td className={`border border-gray-300 p-0 group ${(!vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2) ? 'bg-gray-50' : ''}`}>
                    <div className="flex h-[35px] items-center">
                      <input
                        type="number"
                        value={vrbData.worstCase.externalPurchase2Percent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            worstCase: {
                              ...vrbData.worstCase,
                              externalPurchase2Percent: (parseFloat(e.target.value) || 0) + 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2}
                        className={cn(
                          "w-full h-full border-none bg-white px-[10px] text-sm text-right focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 hover:bg-blue-50 focus:bg-blue-50 transition-colors rounded-none placeholder-gray-400 disabled:bg-transparent disabled:opacity-100",
                          vrbData.worstCase.includeExternalPurchase2 ? "text-gray-900 font-medium" : "text-gray-400"
                        )}
                        placeholder="%"
                      />
                      <span className={cn("text-sm px-1", vrbData.worstCase.includeExternalPurchase2 ? "text-gray-700" : "text-gray-500")}>%</span>
                    </div>
                  </td>
                  <td className={`border border-gray-300 px-[10px] text-right ${(!vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2) ? 'bg-gray-50' : 'bg-gray-50/20'}`}>
                    <span className="text-sm text-gray-900 font-bold">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.worstCase.operatingProfit1;
                          if (vrbData.worstCase.externalPurchase2Base === "total_revenue") baseValue = vrbData.worstCase.estimatedRevenueGoods + vrbData.worstCase.estimatedRevenueServices + vrbData.worstCase.estimatedRevenueHw;
                          else if (vrbData.worstCase.externalPurchase2Base === "revenue_sw") baseValue = vrbData.worstCase.estimatedRevenueGoods;
                          else if (vrbData.worstCase.externalPurchase2Base === "revenue_hw") baseValue = vrbData.worstCase.estimatedRevenueHw;
                          else if (vrbData.worstCase.externalPurchase2Base === "revenue_service") baseValue = vrbData.worstCase.estimatedRevenueServices;
                          else if (vrbData.worstCase.externalPurchase2Base === "operating_profit_ep1") baseValue = vrbData.worstCase.operatingProfitEP1;
                          return (baseValue * vrbData.worstCase.externalPurchase2Percent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </td>
                </tr>

                {/* 영업이익 (외부매입 미반영) */}
                <tr className="h-[35px]">
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">영업이익</td>
                  <td colSpan={3} className="border-x-2 border-blue-400 border-b border-gray-300 px-[10px] text-right font-bold text-gray-900 bg-yellow-50" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#d1d5db' }}>
                    {formatCurrency(vrbData.bestCase.operatingProfit1, "KRW")}
                  </td>
                  <td colSpan={3} className="border border-gray-300 px-[10px] text-right font-bold text-gray-900 bg-red-50">
                    {formatCurrency(vrbData.worstCase.operatingProfit1, "KRW")}
                  </td>
                </tr>

                {/* 영업이익률 (외부매입 미반영) */}
                <tr className="h-[35px]">
                  <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">영업이익률</td>
                  <td
                    colSpan={3}
                    className={`border-x-2 border-blue-400 px-[10px] text-right font-bold text-gray-900 bg-yellow-50 ${!vrbData.bestCase.includeExternalPurchase ? 'border-b-2' : 'border-b border-gray-300'}`}
                    style={{
                      borderLeftColor: '#60a5fa',
                      borderRightColor: '#60a5fa',
                      borderBottomColor: !vrbData.bestCase.includeExternalPurchase ? '#60a5fa' : '#d1d5db'
                    }}
                  >
                    {(vrbData.bestCase.operatingProfit1Percent + 0).toFixed(2)}%
                  </td>
                  <td colSpan={3} className={`border border-gray-300 px-[10px] text-right font-bold text-gray-900 bg-red-50 ${!vrbData.worstCase.includeExternalPurchase ? 'border-b' : ''}`}>
                    {(vrbData.worstCase.operatingProfit1Percent + 0).toFixed(2)}%
                  </td>
                </tr>

                {/* 영업이익 (외부매입1 반영) - 체크박스가 체크된 경우에만 표시 */}
                {vrbData.bestCase.includeExternalPurchase && (
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">영업이익 (외부매입1 반영)</td>
                    <td
                      colSpan={3}
                      className={`border-x-2 border-blue-400 px-[10px] text-right text-gray-900 bg-yellow-100 ${!vrbData.bestCase.includeExternalPurchase2 ? 'border-b-2' : 'border-b border-gray-300'}`}
                      style={{
                        borderLeftColor: '#60a5fa',
                        borderRightColor: '#60a5fa',
                        borderBottomColor: !vrbData.bestCase.includeExternalPurchase2 ? '#60a5fa' : '#d1d5db'
                      }}
                    >
                      <span className="font-bold">{formatCurrency(vrbData.bestCase.operatingProfitEP1, "KRW")}</span>
                      <span className="ml-2 text-sm text-gray-500">({(vrbData.bestCase.operatingProfitEP1Percent + 0).toFixed(2)}%)</span>
                    </td>
                    <td colSpan={3} className={`border border-gray-300 px-[10px] text-right font-bold text-gray-900 bg-red-100 ${!vrbData.worstCase.includeExternalPurchase2 ? 'border-b' : ''}`}>
                      <span>{formatCurrency(vrbData.worstCase.operatingProfitEP1, "KRW")}</span>
                      <span className="ml-2 text-sm text-gray-500">({(vrbData.worstCase.operatingProfitEP1Percent + 0).toFixed(2)}%)</span>
                    </td>
                  </tr>
                )}

                {/* 영업이익 (외부매입2 반영) - 체크박스가 체크된 경우에만 표시 */}
                {vrbData.bestCase.includeExternalPurchase2 && (
                  <tr className="h-[35px]">
                    <td className="border border-gray-300 px-[10px] text-gray-700 font-medium bg-gray-50/30">영업이익 (외부매입1,2 반영)</td>
                    <td colSpan={3} className="border-x-2 border-b-2 border-blue-400 px-[10px] text-right text-gray-900 bg-yellow-200" style={{ borderLeftColor: '#60a5fa', borderRightColor: '#60a5fa', borderBottomColor: '#60a5fa' }}>
                      <span className="font-bold">{formatCurrency(vrbData.bestCase.operatingProfitEP2, "KRW")}</span>
                      <span className="ml-2 text-sm text-gray-500">({(vrbData.bestCase.operatingProfitEP2Percent + 0).toFixed(2)}%)</span>
                    </td>
                    <td colSpan={3} className="border-x border-b border-gray-300 px-[10px] text-right text-gray-900 bg-red-200">
                      <span className="font-bold">{formatCurrency(vrbData.worstCase.operatingProfitEP2, "KRW")}</span>
                      <span className="ml-2 text-sm text-gray-500">({(vrbData.worstCase.operatingProfitEP2Percent + 0).toFixed(2)}%)</span>
                    </td>
                  </tr>
                )}

                {/* 최종 영업이익 안내 (외부매입이 하나라도 체크된 경우 요약으로 한 번 더 강조 가능하지만, 위에서 각각 보여주므로 생략 가능) */}
                {/* 만약 외부매입이 아예 없는 경우는 기본 영업이익만 표시됨. */}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 content-stretch">
          {/* 3. 사업진행 및 근거 효과 */}
          <div className="lg:col-span-3 flex flex-col">
            <h2 className="mb-4 text-lg font-bold text-gray-900">3. 사업진행 및 근거 효과</h2>
            <div className="flex-1 overflow-hidden border border-gray-300 rounded-none bg-white">
              <table className="w-full h-full border-collapse text-sm table-fixed">
                <colgroup>
                  <col className="w-[20%] bg-yellow-50" />
                  <col className="w-[80%] bg-white" />
                </colgroup>
                <tbody>
                  {/* Row 1 - Basis & Effects */}
                  <tr className="h-full">
                    <th className="border-r border-gray-300 px-4 py-2 text-left font-bold text-gray-900 align-middle bg-yellow-50">사업 진행근거 및 기대효과</th>
                    <td className="p-0 h-full">
                      <textarea
                        value={vrbData.businessBasis}
                        onChange={(e) => setVrbData({ ...vrbData, businessBasis: e.target.value })}
                        onMouseUp={(e: any) => handleHeightChange('businessBasis', e.target.offsetHeight)}
                        style={{ height: vrbData.uiSettings?.heights?.['businessBasis'] ? `${vrbData.uiSettings.heights['businessBasis']}px` : '100%' }}
                        rows={4}
                        disabled={isReadOnly}
                        className="w-full h-full border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-y text-sm bg-transparent p-[10px] hover:bg-blue-50 transition-colors rounded-none outline-none block min-h-[120px]"
                        placeholder="사업 진행근거 및 기대효과를 입력하세요"
                        spellCheck={false}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 심의 결과 */}
          <div className="lg:col-span-1 flex flex-col">
            <h2 className="mb-4 text-lg font-bold text-gray-900">4. 심의 결과</h2>
            <div className="flex-1 flex flex-col gap-3">
              <label
                className={cn(
                  "flex-1 flex items-center gap-4 px-6 border-2 transition-all rounded-none group relative overflow-hidden",
                  vrbData.reviewResult === "PROCEED"
                    ? "bg-blue-50/50 border-blue-500 shadow-sm"
                    : "bg-white border-gray-200",
                  isReadOnly
                    ? "cursor-default pointer-events-none"
                    : "cursor-pointer hover:border-blue-200 hover:bg-blue-50/30"
                )}
              >
                <input
                  type="radio"
                  name="reviewResult"
                  value="PROCEED"
                  checked={vrbData.reviewResult === "PROCEED"}
                  onChange={(e) => setVrbData({ ...vrbData, reviewResult: e.target.value })}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  vrbData.reviewResult === "PROCEED" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                )}>
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-lg font-bold", vrbData.reviewResult === "PROCEED" ? "text-blue-700" : "text-gray-900")}>진행</span>
                  <span className="text-xs text-gray-500 font-medium">Proceed</span>
                </div>
                {vrbData.reviewResult === "PROCEED" && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 [clip-path:polygon(100%_0,0_0,100%_100%)]">
                    <CheckCircle2 className="absolute top-1 right-1 h-3 w-3 text-white" />
                  </div>
                )}
              </label>

              <label
                className={cn(
                  "flex-1 flex items-center gap-4 px-6 border-2 transition-all rounded-none group relative overflow-hidden",
                  vrbData.reviewResult === "STOP"
                    ? "bg-red-50/50 border-red-500 shadow-sm"
                    : "bg-white border-gray-200",
                  isReadOnly
                    ? "cursor-default pointer-events-none"
                    : "cursor-pointer hover:border-red-200 hover:bg-red-50/30"
                )}
              >
                <input
                  type="radio"
                  name="reviewResult"
                  value="STOP"
                  checked={vrbData.reviewResult === "STOP"}
                  onChange={(e) => setVrbData({ ...vrbData, reviewResult: e.target.value })}
                  disabled={isReadOnly}
                  className="sr-only"
                />
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  vrbData.reviewResult === "STOP" ? "bg-red-500 text-white" : "bg-red-50 text-red-500 group-hover:bg-red-100"
                )}>
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-lg font-bold", vrbData.reviewResult === "STOP" ? "text-red-700" : "text-gray-900")}>미진행</span>
                  <span className="text-xs text-gray-500 font-medium">Stop</span>
                </div>
                {vrbData.reviewResult === "STOP" && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 [clip-path:polygon(100%_0,0_0,100%_100%)]">
                    <XCircle className="absolute top-1 right-1 h-3 w-3 text-white" />
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
      </div >


      {/* 반려 사유 표시 */}
      {
        vrbStatus === 'rejected' && rejectionReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">반려 사유</h3>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{rejectionReason}</p>
              </div>
            </div>
          </div>
        )
      }




    </div>
  );
}
