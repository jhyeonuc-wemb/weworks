"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, List, Plus, Copy, Save, CheckCircle2, XCircle, Trash2, AlertCircle, Calendar as CalendarIcon, FileSpreadsheet, Download } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";
import { DatePicker, Dropdown, Button, Input, Select, Badge, Textarea, StatusDropdown } from "@/components/ui";
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
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVrbId, setCurrentVrbId] = useState<number | null>(null);
  const [isNewVrb, setIsNewVrb] = useState(false);
  const [vrbStatus, setVrbStatus] = useState<string>("STANDBY");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");

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
      projectCosts: [],
      otherGoodsItems: [],
      existingSystemLinkage: 0,
      riskCostPercent: 10,
      riskCostBase: "total_revenue",
      externalPurchasePercent: 30,
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
      externalPurchasePercent: 30,
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
        const [clientsRes, usersRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/users"),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
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

              // 저장된 이름으로 검색어 초기화
              if (review.customer_name) {
                setCustomerSearch(review.customer_name);
              }
              if (review.sales_manager) {
                setSalesSearch(review.sales_manager);
              }
              if (review.ps_manager) {
                setPsSearch(review.ps_manager);
              }

              setVrbData({
                customerName: review.customer_name || "",
                projectBudget: review.project_budget || "",
                winProbability: review.win_probability || "",
                winDate: review.win_date ? review.win_date.split('T')[0].substring(0, 7) : "",
                businessType: review.business_type || "",
                partners: review.partners || "",
                competitors: review.competitors || "",
                customerInfo: review.customer_info || "",
                salesManager: review.sales_manager || "",
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
                    : [],
                  otherGoodsItems: (review.worstCase?.otherGoodsItems && review.worstCase.otherGoodsItems.length > 0)
                    ? review.worstCase.otherGoodsItems.map((item: any) => ({
                      item: item.item || "",
                      amount: parseFloat(item.amount) || 0,
                    }))
                    : [],
                  existingSystemLinkage: parseFloat(review.worst_existing_system_linkage) || 0,
                  riskCostPercent: parseFloat(review.worst_risk_cost_percent) || 10,
                  riskCostBase: review.worst_risk_cost_base || "total_revenue",
                  externalPurchasePercent: parseFloat(review.worst_external_purchase_percent) || 30,
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
                  riskCostPercent: parseFloat(review.best_risk_cost_percent) || 10,
                  riskCostBase: review.best_risk_cost_base || "total_revenue",
                  externalPurchasePercent: parseFloat(review.best_external_purchase_percent) || 30,
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
                uiSettings: review.ui_settings || { heights: {} },
              });
            }
          } else {
            // 신규 VRB 생성 - 프로젝트 정보로 초기화
            setIsNewVrb(true);
            setCurrentVrbId(null);

            if (proj) {
              // 프로젝트 정보로 초기화 및 검색어 설정
              const customerName = proj.customer_name || "";
              const salesName = proj.sales_representative_name || "";

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

  // 필터링된 PS 목록 (PM, admin, 또는 역할이 없는 사용자도 포함)
  const filteredPs = users.filter(
    (user) =>
      (user.role_name === "pm" || user.role_name === "admin" || !user.role_name) &&
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
          }),
        });

        if (!createResponse.ok) {
          throw new Error("VRB Review 생성에 실패했습니다.");
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
          status: vrbStatus === 'STANDBY' ? 'IN_PROGRESS' : vrbStatus,
        }),
      });

      if (updateResponse.ok) {
        if (vrbStatus === 'STANDBY') {
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

      alert("VRB Review가 저장되었습니다.");
    } catch (error: any) {
      console.error("[VRB Save] 저장 에러:", error);
      alert(error.message || "VRB Review 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [id, currentVrbId, isNewVrb, vrbData]);

  // 승인 처리
  const handleApprove = useCallback(async () => {
    if (!currentVrbId) {
      alert("VRB Review를 먼저 저장해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/vrb-reviews/${currentVrbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(id), // 프로젝트 ID 검증을 위해 포함
          status: "COMPLETED",
          rejection_reason: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "승인 처리에 실패했습니다." }));
        throw new Error(errorData.error || errorData.message || "승인 처리에 실패했습니다.");
      }

      setVrbStatus("COMPLETED");
      setRejectionReason("");
      setIsApprovalModalOpen(false);
      alert("VRB Review가 승인되었습니다.");
    } catch (error: any) {
      console.error("Error approving VRB review:", error);
      alert(error.message || "승인 처리에 실패했습니다.");
    }
  }, [currentVrbId]);

  // 반려 처리
  const handleReject = useCallback(async () => {
    if (!currentVrbId) {
      alert("VRB Review를 먼저 저장해주세요.");
      return;
    }

    if (!rejectionReasonInput.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/vrb-reviews/${currentVrbId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: parseInt(id), // 프로젝트 ID 검증을 위해 포함
          status: "COMPLETED",
          rejection_reason: rejectionReasonInput,
        }),
      });

      if (!response.ok) {
        throw new Error("반려 처리에 실패했습니다.");
      }

      setVrbStatus("COMPLETED");
      setRejectionReason(rejectionReasonInput);
      setRejectionReasonInput("");
      setIsRejectionModalOpen(false);
      alert("VRB Review가 반려되었습니다.");
    } catch (error: any) {
      console.error("Error rejecting VRB review:", error);
      alert(error.message || "반려 처리에 실패했습니다.");
    }
  }, [currentVrbId, rejectionReasonInput]);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentVrbId) {
      alert("먼저 저장을 해주세요.");
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
        // alert("상태가 변경되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`상태 변경 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (e) {
      console.error(e);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
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
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              VRB - {project?.name || "프로젝트"}
            </h1>
            <p className="text-sm text-gray-600">
              {project?.projectCode} | {project?.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusDropdown
            status={vrbStatus || 'STANDBY'}
            onStatusChange={handleStatusChange}
            disabled={isSaving || !currentVrbId}
            phase="VRB"
          />

          <Button
            variant="secondary"
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm"
          >
            <Download className="h-4 w-4" />
            엑셀
          </Button>

          <Button
            variant="primary"
            onClick={async () => {
              await handleSave();
              await handleStatusChange('COMPLETED');
            }}
            disabled={isSaving || vrbStatus === 'COMPLETED'}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            작성완료
          </Button>
        </div>
      </div>

      {/* 프로젝트 개요 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">프로젝트 개요</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <Input
              type="text"
              label="사업 예산 (VAT 포함)"
              value={vrbData.projectBudget}
              onChange={(e) => setVrbData({ ...vrbData, projectBudget: e.target.value })}
              placeholder="예: 2.14억"
              disabled={isReadOnly}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">고객사명</label>
            <div className="relative mt-1">
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                        onClick={() => handleCustomerSelect(client.id.toString(), client.name)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <div className="font-medium text-gray-900">{client.name}</div>
                        {client.code && (
                          <div className="text-xs text-gray-500">{client.code}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <Input
              type="text"
              label="고객 정보"
              value={vrbData.customerInfo}
              onChange={(e) => setVrbData({ ...vrbData, customerInfo: e.target.value })}
              placeholder="예: 계통사업처/계통제어부"
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업형태</label>
            <Dropdown
              value={vrbData.businessType}
              onChange={(val) => setVrbData({ ...vrbData, businessType: val as string })}
              options={[
                { value: "", label: "선택" },
                { value: "입찰", label: "입찰" },
                { value: "수의계약", label: "수의계약" }
              ]}
              placeholder="선택"
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수주확률</label>
            <Dropdown
              value={vrbData.winProbability}
              onChange={(val) => setVrbData({ ...vrbData, winProbability: val as string })}
              options={[
                { value: "", label: "선택" },
                { value: "상(90%)", label: "상(90%)" },
                { value: "중(60%)", label: "중(60%)" },
                { value: "하(30%)", label: "하(30%)" }
              ]}
              placeholder="선택"
              disabled={isReadOnly}
            />
          </div>
          <DatePicker
            label="수주시기"
            date={vrbData.winDate ? new Date(vrbData.winDate + "-01") : undefined}
            setDate={(date) => setVrbData({ ...vrbData, winDate: date ? format(date, "yyyy-MM") : "" })}
            disabled={isReadOnly}
          />
          <DatePicker
            label="예상 사업기간 (시작)"
            date={vrbData.expectedStartDate ? new Date(vrbData.expectedStartDate + "-01") : undefined}
            setDate={(date) => setVrbData({ ...vrbData, expectedStartDate: date ? format(date, "yyyy-MM") : "" })}
            disabled={isReadOnly}
          />
          <DatePicker
            label="예상 사업기간 (종료)"
            date={vrbData.expectedEndDate ? new Date(vrbData.expectedEndDate + "-01") : undefined}
            setDate={(date) => setVrbData({ ...vrbData, expectedEndDate: date ? format(date, "yyyy-MM") : "" })}
            disabled={isReadOnly}
          />
          <Input
            label="주사업자"
            type="text"
            value={vrbData.mainContractor}
            onChange={(e) => setVrbData({ ...vrbData, mainContractor: e.target.value })}
            placeholder="예: (주)위엠비"
            disabled={isReadOnly}
          />
          <Input
            label="파트너사"
            type="text"
            value={vrbData.partners}
            onChange={(e) => setVrbData({ ...vrbData, partners: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="파트너사 정보"
            type="text"
            value={vrbData.partnerInfo}
            onChange={(e) => setVrbData({ ...vrbData, partnerInfo: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="경쟁사"
            type="text"
            value={vrbData.competitors}
            onChange={(e) => setVrbData({ ...vrbData, competitors: e.target.value })}
            disabled={isReadOnly}
          />
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">영업</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => {
                  setSalesSearch(e.target.value);
                  setShowSalesDropdown(true);
                  if (!e.target.value) {
                    setVrbData((prev) => ({ ...prev, salesManager: "" }));
                  }
                }}
                onFocus={() => setShowSalesDropdown(true)}
                placeholder="영업대표 이름 또는 이메일로 검색..."
                disabled={isReadOnly}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                        onClick={() => handleSalesSelect(user.id.toString(), user.name)}
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
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">PS</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={psSearch}
                onChange={(e) => {
                  setPsSearch(e.target.value);
                  setShowPsDropdown(true);
                  if (!e.target.value) {
                    setVrbData((prev) => ({ ...prev, psManager: "" }));
                  }
                }}
                onFocus={() => setShowPsDropdown(true)}
                placeholder="PS 이름 또는 이메일로 검색..."
                disabled={isReadOnly}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {showPsDropdown && filteredPs.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowPsDropdown(false)}
                  />
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {filteredPs.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handlePsSelect(user.id.toString(), user.name)}
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
          <div>
            <label className="block text-sm font-medium text-gray-700">주요 도입 솔루션</label>
            <input
              type="text"
              value={vrbData.keySolutions}
              onChange={(e) => setVrbData({ ...vrbData, keySolutions: e.target.value })}
              placeholder="예: RENOBIT, TIM"
              disabled={isReadOnly}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 사업배경 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">사업배경</h2>
        <textarea
          value={vrbData.businessBackground}
          onChange={(e) => setVrbData({ ...vrbData, businessBackground: e.target.value })}
          onMouseUp={(e: any) => handleHeightChange('businessBackground', e.target.offsetHeight)}
          style={{ height: vrbData.uiSettings?.heights?.['businessBackground'] ? `${vrbData.uiSettings.heights['businessBackground']}px` : undefined }}
          rows={4}
          disabled={isReadOnly}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y transition-all duration-200"
          placeholder="사업배경을 입력하세요"
        />
      </div>

      {/* 사업범위 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">사업범위</h2>
        <textarea
          value={vrbData.businessScope}
          onChange={(e) => setVrbData({ ...vrbData, businessScope: e.target.value })}
          onMouseUp={(e: any) => handleHeightChange('businessScope', e.target.offsetHeight)}
          style={{ height: vrbData.uiSettings?.heights?.['businessScope'] ? `${vrbData.uiSettings.heights['businessScope']}px` : undefined }}
          rows={4}
          disabled={isReadOnly}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y transition-all duration-200"
          placeholder="사업범위를 입력하세요"
        />
      </div>

      {/* 주요내용 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">주요내용</h2>
          <button
            onClick={handleAddContent}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            내용 추가
          </button>
        </div>
        <div className="space-y-2">
          {vrbData.keyContents.map((content, index) => (
            <div
              key={index}
              className="flex gap-2 items-start p-1"
            >
              <DatePicker
                date={content.date ? new Date(content.date) : undefined}
                setDate={(date) => handleContentChange(index, "date", date ? format(date, "yyyy-MM-dd") : "")}
                disabled={isReadOnly}
                className="w-40"
              />
              <textarea
                value={content.content}
                onChange={(e) => handleContentChange(index, "content", e.target.value)}
                onMouseUp={(e: any) => handleContentHeightChange(index, e.target.offsetHeight)}
                style={{ height: content.ui_height ? `${content.ui_height}px` : undefined }}
                rows={3}
                placeholder="내용을 입력하세요"
                disabled={isReadOnly}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y transition-all duration-200"
              />
              <button
                onClick={() => handleRemoveContent(index)}
                className="mt-2 rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {vrbData.keyContents.length === 0 && (
            <p className="text-sm text-gray-500">내용이 없습니다. "내용 추가" 버튼을 클릭하여 추가하세요.</p>
          )}
        </div>
      </div>

      {/* 주요활동 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">주요활동</h2>
          <button
            onClick={handleAddActivity}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            활동 추가
          </button>
        </div>
        <div className="space-y-2">
          {vrbData.keyActivities.map((activity, index) => (
            <div
              key={index}
              className="flex gap-2 items-start p-1"
            >
              <DatePicker
                date={activity.date ? new Date(activity.date) : undefined}
                setDate={(date) => handleActivityChange(index, "date", date ? format(date, "yyyy-MM-dd") : "")}
                disabled={isReadOnly}
                className="w-40"
              />
              <textarea
                value={activity.activity}
                onChange={(e) => handleActivityChange(index, "activity", e.target.value)}
                onMouseUp={(e: any) => handleActivityHeightChange(index, e.target.offsetHeight)}
                style={{ height: activity.ui_height ? `${activity.ui_height}px` : undefined }}
                rows={3}
                placeholder="활동을 입력하세요"
                disabled={isReadOnly}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y transition-all duration-200"
              />
              <button
                onClick={() => handleRemoveActivity(index)}
                className="mt-2 rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {vrbData.keyActivities.length === 0 && (
            <p className="text-sm text-gray-500">활동 내역이 없습니다. "활동 추가" 버튼을 클릭하여 추가하세요.</p>
          )}
        </div>
      </div>

      {/* 리스크 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">리스크</h2>

        <textarea
          value={vrbData.risk}
          onChange={(e) => setVrbData({ ...vrbData, risk: e.target.value })}
          onMouseUp={(e: any) => handleHeightChange('risk', e.target.offsetHeight)}
          style={{ height: vrbData.uiSettings?.heights?.['risk'] ? `${vrbData.uiSettings.heights['risk']}px` : undefined }}
          rows={4}
          placeholder="리스크를 입력하세요"
          disabled={isReadOnly}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y transition-all duration-200"
        />
      </div>

      {/* 사전 수지분석서 요약 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">사전 수지분석서 요약</h2>

        {/* 기본 필드 표 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-[20%]">항목</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-500 border-l-4 border-l-green-700 shadow-md w-[40%]">Best Case</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-100 w-[40%]">Worst Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* 예상 수주 금액 (SW,물품) */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">예상 수주 금액 (SW,물품)</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueGoods"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueGoods: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueGoods: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["best-estimatedRevenueGoods"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueGoods);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueGoods"]: currentValue
                      }));
                    }}
                    className="block w-full h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                  />
                </td>
                <td className="px-4 py-3 bg-gray-50">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueGoods"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueGoods: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueGoods: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["worst-estimatedRevenueGoods"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueGoods);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueGoods"]: currentValue
                      }));
                    }}
                    className="block w-full h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                  />
                </td>
              </tr>

              {/* 예상 수주 금액 (HW) */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">예상 수주 금액 (HW)</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueHw"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueHw: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueHw: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["best-estimatedRevenueHw"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueHw);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueHw"]: currentValue
                      }));
                    }}
                    className="block w-full h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                  />
                </td>
                <td className="px-4 py-3 bg-gray-50">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueHw"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueHw: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueHw: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["worst-estimatedRevenueHw"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueHw);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueHw"]: currentValue
                      }));
                    }}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-right shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </td>
              </tr>

              {/* 예상 수주 금액 (용역) */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">예상 수주 금액 (용역)</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueServices"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueServices: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        bestCase: {
                          ...vrbData.bestCase,
                          estimatedRevenueServices: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["best-estimatedRevenueServices"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.bestCase.estimatedRevenueServices);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["best-estimatedRevenueServices"]: currentValue
                      }));
                    }}
                    className="block w-full h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                  />
                </td>
                <td className="px-4 py-3 bg-gray-50">
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
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueServices"]: formattedValue
                      }));
                      const numValue = parseNumberFromString(formattedValue);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueServices: numValue,
                        },
                      });
                    }}
                    onBlur={(e) => {
                      const numValue = parseNumberFromString(e.target.value);
                      setVrbData({
                        ...vrbData,
                        worstCase: {
                          ...vrbData.worstCase,
                          estimatedRevenueServices: numValue,
                        },
                      });
                      setNumberInputValues(prev => {
                        const newState = { ...prev };
                        delete newState["worst-estimatedRevenueServices"];
                        return newState;
                      });
                    }}
                    onFocus={(e) => {
                      const currentValue = formatNumberWithCommas(vrbData.worstCase.estimatedRevenueServices);
                      setNumberInputValues(prev => ({
                        ...prev,
                        ["worst-estimatedRevenueServices"]: currentValue
                      }));
                    }}
                    className="block w-full h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                  />
                </td>
              </tr>

              {/* 예상 수주 금액 (합계) */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">예상 수주 금액</td>
                <td className="px-4 py-3 bg-gradient-to-r from-green-200 to-green-100 border-l-4 border-l-green-700 shadow-md">
                  <p className="text-xl font-bold text-green-900 text-right">
                    {formatCurrency(
                      vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw,
                      "KRW"
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 bg-gray-100">
                  <p className="text-lg font-semibold text-gray-700 text-right">
                    {formatCurrency(
                      vrbData.worstCase.estimatedRevenueGoods + vrbData.worstCase.estimatedRevenueServices + vrbData.worstCase.estimatedRevenueHw,
                      "KRW"
                    )}
                  </p>
                </td>
              </tr>

              {/* 타사 상품 매입 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">타사 상품 매입</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="space-y-2">
                    {vrbData.bestCase.otherGoodsItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) =>
                            handleOtherGoodsChange("best", index, "item", e.target.value)
                          }
                          placeholder="항목"
                          className="flex-1 h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                        />
                        <input
                          type="text"
                          value={numberInputValues[`best-otherGoods-${index}`] !== undefined
                            ? numberInputValues[`best-otherGoods-${index}`]
                            : formatNumberWithCommas(item.amount)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                            const formattedValue = addCommasToNumber(inputValue);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`best-otherGoods-${index}`]: formattedValue
                            }));
                            const numValue = parseNumberFromString(formattedValue);
                            handleOtherGoodsChange("best", index, "amount", numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseNumberFromString(e.target.value);
                            handleOtherGoodsChange("best", index, "amount", numValue);
                            setNumberInputValues(prev => {
                              const newState = { ...prev };
                              delete newState[`best-otherGoods-${index}`];
                              return newState;
                            });
                          }}
                          onFocus={(e) => {
                            const currentValue = formatNumberWithCommas(item.amount);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`best-otherGoods-${index}`]: currentValue
                            }));
                          }}
                          placeholder="금액"
                          className="w-48 h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                        />
                        <button
                          onClick={() => handleOtherGoodsRemove("best", index)}
                          className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleOtherGoodsAdd("best")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.bestCase.otherGoodsItems.length > 0 && (
                      <p className="text-sm font-bold text-green-900 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.bestCase.otherGoodsItems.reduce((sum, item) => sum + item.amount, 0),
                          "KRW"
                        )}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {vrbData.worstCase.otherGoodsItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) =>
                            handleOtherGoodsChange("worst", index, "item", e.target.value)
                          }
                          placeholder="항목"
                          className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                        />
                        <input
                          type="text"
                          value={numberInputValues[`worst-otherGoods-${index}`] !== undefined
                            ? numberInputValues[`worst-otherGoods-${index}`]
                            : formatNumberWithCommas(item.amount)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                            const formattedValue = addCommasToNumber(inputValue);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`worst-otherGoods-${index}`]: formattedValue
                            }));
                            const numValue = parseNumberFromString(formattedValue);
                            handleOtherGoodsChange("worst", index, "amount", numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseNumberFromString(e.target.value);
                            handleOtherGoodsChange("worst", index, "amount", numValue);
                            setNumberInputValues(prev => {
                              const newState = { ...prev };
                              delete newState[`worst-otherGoods-${index}`];
                              return newState;
                            });
                          }}
                          onFocus={(e) => {
                            const currentValue = formatNumberWithCommas(item.amount);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`worst-otherGoods-${index}`]: currentValue
                            }));
                          }}
                          placeholder="금액"
                          className="w-48 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                        />
                        <button
                          onClick={() => handleOtherGoodsRemove("worst", index)}
                          className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleOtherGoodsAdd("worst")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.worstCase.otherGoodsItems.length > 0 && (
                      <p className="text-sm font-bold text-gray-900 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.worstCase.otherGoodsItems.reduce((sum, item) => sum + item.amount, 0),
                          "KRW"
                        )}
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              {/* 프로젝트 수행 비용 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">프로젝트 수행 비용</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="space-y-2">
                    {vrbData.bestCase.projectCosts.map((cost, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={cost.item}
                          onChange={(e) =>
                            handleProjectCostChange("best", index, "item", e.target.value)
                          }
                          placeholder="항목"
                          className="flex-1 h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                        />
                        <input
                          type="text"
                          value={numberInputValues[`best-projectCost-${index}`] !== undefined
                            ? numberInputValues[`best-projectCost-${index}`]
                            : formatNumberWithCommas(cost.amount)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                            const formattedValue = addCommasToNumber(inputValue);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`best-projectCost-${index}`]: formattedValue
                            }));
                            const numValue = parseNumberFromString(formattedValue);
                            handleProjectCostChange("best", index, "amount", numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseNumberFromString(e.target.value);
                            handleProjectCostChange("best", index, "amount", numValue);
                            setNumberInputValues(prev => {
                              const newState = { ...prev };
                              delete newState[`best-projectCost-${index}`];
                              return newState;
                            });
                          }}
                          onFocus={(e) => {
                            const currentValue = formatNumberWithCommas(cost.amount);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`best-projectCost-${index}`]: currentValue
                            }));
                          }}
                          placeholder="금액"
                          className="w-48 h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                        />
                        <button
                          onClick={() => handleRemoveProjectCost("best", index)}
                          className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddProjectCost("best")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.bestCase.projectCosts.length > 0 && (
                      <p className="text-sm font-bold text-green-900 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.bestCase.projectCosts.reduce((sum, cost) => sum + cost.amount, 0),
                          "KRW"
                        )}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {vrbData.worstCase.projectCosts.map((cost, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={cost.item}
                          onChange={(e) =>
                            handleProjectCostChange("worst", index, "item", e.target.value)
                          }
                          placeholder="항목"
                          className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                        />
                        <input
                          type="text"
                          value={numberInputValues[`worst-projectCost-${index}`] !== undefined
                            ? numberInputValues[`worst-projectCost-${index}`]
                            : formatNumberWithCommas(cost.amount)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value.replace(/[^0-9,]/g, "");
                            const formattedValue = addCommasToNumber(inputValue);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`worst-projectCost-${index}`]: formattedValue
                            }));
                            const numValue = parseNumberFromString(formattedValue);
                            handleProjectCostChange("worst", index, "amount", numValue);
                          }}
                          onBlur={(e) => {
                            const numValue = parseNumberFromString(e.target.value);
                            handleProjectCostChange("worst", index, "amount", numValue);
                            setNumberInputValues(prev => {
                              const newState = { ...prev };
                              delete newState[`worst-projectCost-${index}`];
                              return newState;
                            });
                          }}
                          onFocus={(e) => {
                            const currentValue = formatNumberWithCommas(cost.amount);
                            setNumberInputValues(prev => ({
                              ...prev,
                              [`worst-projectCost-${index}`]: currentValue
                            }));
                          }}
                          placeholder="금액"
                          className="w-48 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-right shadow-sm focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                        />
                        <button
                          onClick={() => handleRemoveProjectCost("worst", index)}
                          className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddProjectCost("worst")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.worstCase.projectCosts.length > 0 && (
                      <p className="text-sm font-medium text-gray-600 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.worstCase.projectCosts.reduce((sum, cost) => sum + cost.amount, 0),
                          "KRW"
                        )}
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              {/* 예상 M/M */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">예상 M/M</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="space-y-2">
                    {vrbData.bestCase.estimatedMmItems.length === 0 && vrbData.bestCase.estimatedMm === 0 && (
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
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
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={mmItem.item}
                            onChange={(e) => handleEstimatedMmChange("best", index, "item", e.target.value)}
                            className="flex-1 h-11 rounded-xl border-2 border-green-400 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:border-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                            placeholder="항목명"
                          />
                          <input
                            type="text"
                            value={mmInputValues[`best-${index}`] !== undefined
                              ? mmInputValues[`best-${index}`]
                              : mmItem.mm.toFixed(2)
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value.replace(/[^0-9.]/g, "");

                              // 입력 중간 상태 저장
                              setMmInputValues(prev => ({
                                ...prev,
                                [`best-${index}`]: inputValue
                              }));

                              // 빈 값인 경우
                              if (inputValue === "") {
                                handleEstimatedMmChange("best", index, "mm", 0);
                                return;
                              }

                              // 소수점만 있는 경우
                              if (inputValue === ".") {
                                handleEstimatedMmChange("best", index, "mm", 0);
                                return;
                              }

                              // 소수점이 여러 개인 경우 첫 번째 소수점만 유지
                              const firstDotIndex = inputValue.indexOf(".");
                              let normalizedValue = inputValue;
                              if (firstDotIndex !== -1) {
                                const beforeDot = inputValue.substring(0, firstDotIndex + 1);
                                const afterDot = inputValue.substring(firstDotIndex + 1).replace(/\./g, "");
                                normalizedValue = beforeDot + afterDot;
                              }

                              // 숫자로 변환 가능한 경우에만 저장
                              const value = parseFloat(normalizedValue);
                              if (!isNaN(value)) {
                                handleEstimatedMmChange("best", index, "mm", value);
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const formattedValue = parseFloat(value.toFixed(2));
                              handleEstimatedMmChange("best", index, "mm", formattedValue);
                              // 포커스를 잃으면 입력 중간 상태 제거
                              setMmInputValues(prev => {
                                const newState = { ...prev };
                                delete newState[`best-${index}`];
                                return newState;
                              });
                            }}
                            onFocus={(e) => {
                              // 포커스를 받으면 현재 값을 입력 중간 상태로 설정
                              const currentValue = mmItem.mm.toFixed(2);
                              setMmInputValues(prev => ({
                                ...prev,
                                [`best-${index}`]: currentValue
                              }));
                            }}
                            className="w-24 rounded-md border-2 border-green-400 bg-white px-3 py-2 text-sm font-medium text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="M/M"
                          />
                          <span className="text-sm text-gray-500">M/M</span>
                          <button
                            onClick={() => handleRemoveEstimatedMm("best", index)}
                            className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                            title="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => handleAddEstimatedMm("best")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.bestCase.estimatedMmItems.length > 0 && (
                      <p className="text-sm font-bold text-green-900 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.bestCase.estimatedMmItems.reduce((sum, item) => sum + (item.mm * 10000000), 0),
                          "KRW"
                        )} <span className="text-gray-500">(M/M당 10,000,000원으로 계산)</span>
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="space-y-2">
                    {vrbData.worstCase.estimatedMmItems.length === 0 ? (
                      <p className="text-sm text-gray-400">-</p>
                    ) : (
                      vrbData.worstCase.estimatedMmItems.map((mmItem, index) => {
                        return (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={mmItem.item}
                              onChange={(e) => handleEstimatedMmChange("worst", index, "item", e.target.value)}
                              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              placeholder="항목명"
                            />
                            <input
                              type="text"
                              value={mmInputValues[`worst-${index}`] !== undefined
                                ? mmInputValues[`worst-${index}`]
                                : mmItem.mm.toFixed(2)
                              }
                              onChange={(e) => {
                                const inputValue = e.target.value.replace(/[^0-9.]/g, "");

                                // 입력 중간 상태 저장
                                setMmInputValues(prev => ({
                                  ...prev,
                                  [`worst-${index}`]: inputValue
                                }));

                                // 빈 값인 경우
                                if (inputValue === "") {
                                  handleEstimatedMmChange("worst", index, "mm", 0);
                                  return;
                                }

                                // 소수점만 있는 경우
                                if (inputValue === ".") {
                                  handleEstimatedMmChange("worst", index, "mm", 0);
                                  return;
                                }

                                // 소수점이 여러 개인 경우 첫 번째 소수점만 유지
                                const firstDotIndex = inputValue.indexOf(".");
                                let normalizedValue = inputValue;
                                if (firstDotIndex !== -1) {
                                  const beforeDot = inputValue.substring(0, firstDotIndex + 1);
                                  const afterDot = inputValue.substring(firstDotIndex + 1).replace(/\./g, "");
                                  normalizedValue = beforeDot + afterDot;
                                }

                                // 숫자로 변환 가능한 경우에만 저장
                                const value = parseFloat(normalizedValue);
                                if (!isNaN(value)) {
                                  handleEstimatedMmChange("worst", index, "mm", value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                const formattedValue = parseFloat(value.toFixed(2));
                                handleEstimatedMmChange("worst", index, "mm", formattedValue);
                                // 포커스를 잃으면 입력 중간 상태 제거
                                setMmInputValues(prev => {
                                  const newState = { ...prev };
                                  delete newState[`worst-${index}`];
                                  return newState;
                                });
                              }}
                              onFocus={(e) => {
                                // 포커스를 받으면 현재 값을 입력 중간 상태로 설정
                                const currentValue = mmItem.mm.toFixed(2);
                                setMmInputValues(prev => ({
                                  ...prev,
                                  [`worst-${index}`]: currentValue
                                }));
                              }}
                              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm text-right shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              placeholder="M/M"
                            />
                            <span className="text-sm text-gray-500">M/M</span>
                            <button
                              onClick={() => handleRemoveEstimatedMm("worst", index)}
                              className="rounded-md border border-red-300 bg-white p-1.5 text-red-700 hover:bg-red-50"
                              title="삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                    <button
                      onClick={() => handleAddEstimatedMm("worst")}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      항목 추가
                    </button>
                    {vrbData.worstCase.estimatedMmItems.length > 0 && (
                      <p className="text-sm font-medium text-gray-600 text-right mt-1">
                        합계: {formatCurrency(
                          vrbData.worstCase.estimatedMmItems.reduce((sum, item) => sum + (item.mm * 10000000), 0),
                          "KRW"
                        )} <span className="text-gray-500">(M/M당 10,000,000원으로 계산)</span>
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              {/* 리스크 비용 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">리스크 비용</td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.bestCase.riskCostBase}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            riskCostBase: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                      ]}
                      disabled={isReadOnly}
                      variant="standard"
                      className="w-[220px]"
                    />
                    <div className="flex items-center gap-1">
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
                        className="w-14 rounded-md border-2 border-green-400 bg-white px-2 py-1.5 text-sm font-medium text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-bold text-green-900 ml-auto whitespace-nowrap">
                      {formatCurrency(
                        (() => {
                          let baseValue = vrbData.bestCase.estimatedRevenueGoods + vrbData.bestCase.estimatedRevenueServices + vrbData.bestCase.estimatedRevenueHw;
                          if (vrbData.bestCase.riskCostBase === "revenue_sw") baseValue = vrbData.bestCase.estimatedRevenueGoods;
                          else if (vrbData.bestCase.riskCostBase === "revenue_hw") baseValue = vrbData.bestCase.estimatedRevenueHw;
                          else if (vrbData.bestCase.riskCostBase === "revenue_service") baseValue = vrbData.bestCase.estimatedRevenueServices;
                          else if (vrbData.bestCase.riskCostBase === "operating_profit") baseValue = 0;
                          return (baseValue * vrbData.bestCase.riskCostPercent) / 100;
                        })(),
                        "KRW"
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.worstCase.riskCostBase}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            riskCostBase: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                      ]}
                      disabled={isReadOnly}
                      variant="standard"
                      className="w-[180px]"
                    />
                    <div className="flex items-center gap-1">
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
                        className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-right shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 ml-auto whitespace-nowrap">
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
                  </div>
                </td>
              </tr>

              {/* 외부 매입1 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
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
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.bestCase.externalPurchaseBase}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            externalPurchaseBase: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                        { value: "operating_profit_ep1", label: "영업이익(외부매입1 반영)" },
                      ]}
                      disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase}
                      variant="standard"
                      className="w-[220px]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={vrbData.bestCase.externalPurchasePercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              externalPurchasePercent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase}
                        className="w-14 rounded-md border-2 border-green-400 bg-white px-2 py-1.5 text-sm font-medium text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-bold text-green-900 ml-auto whitespace-nowrap">
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
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.worstCase.externalPurchaseBase}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            externalPurchaseBase: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                        { value: "operating_profit_ep1", label: "영업이익(외부매입1 반영)" },
                      ]}
                      disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase}
                      variant="standard"
                      className="w-[220px]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={vrbData.worstCase.externalPurchasePercent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            worstCase: {
                              ...vrbData.worstCase,
                              externalPurchasePercent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase}
                        className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-right shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 ml-auto whitespace-nowrap">
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
                  </div>
                </td>
              </tr>

              {/* 외부 매입2 */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
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
                      className={`h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 ${!vrbData.bestCase.includeExternalPurchase ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!vrbData.bestCase.includeExternalPurchase}
                      title={!vrbData.bestCase.includeExternalPurchase ? "외부 매입1을 먼저 선택해야 합니다." : ""}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 bg-green-100 border-l-4 border-l-green-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.bestCase.externalPurchase2Base}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          bestCase: {
                            ...vrbData.bestCase,
                            externalPurchase2Base: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                        { value: "operating_profit_ep1", label: "영업이익(외부매입1 반영)" },
                      ]}
                      disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2}
                      variant="standard"
                      className="w-[220px]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={vrbData.bestCase.externalPurchase2Percent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            bestCase: {
                              ...vrbData.bestCase,
                              externalPurchase2Percent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.bestCase.includeExternalPurchase || !vrbData.bestCase.includeExternalPurchase2}
                        className="w-14 rounded-md border-2 border-green-400 bg-white px-2 py-1.5 text-sm font-medium text-right shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-bold text-green-900 ml-auto whitespace-nowrap">
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
                  </div>
                </td>
                <td className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Dropdown
                      value={vrbData.worstCase.externalPurchase2Base}
                      onChange={(val) =>
                        setVrbData({
                          ...vrbData,
                          worstCase: {
                            ...vrbData.worstCase,
                            externalPurchase2Base: val as string,
                          },
                        })
                      }
                      options={[
                        { value: "total_revenue", label: "전체 사업비" },
                        { value: "revenue_sw", label: "예상 수주 금액 (SW)" },
                        { value: "revenue_hw", label: "예상 수주 금액 (HW)" },
                        { value: "revenue_service", label: "예상 수주 금액 (용역)" },
                        { value: "operating_profit", label: "영업이익" },
                        { value: "operating_profit_ep1", label: "영업이익(외부매입1 반영)" },
                      ]}
                      disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2}
                      variant="standard"
                      className="w-[220px]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={vrbData.worstCase.externalPurchase2Percent}
                        onChange={(e) =>
                          setVrbData({
                            ...vrbData,
                            worstCase: {
                              ...vrbData.worstCase,
                              externalPurchase2Percent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={isReadOnly || !vrbData.worstCase.includeExternalPurchase || !vrbData.worstCase.includeExternalPurchase2}
                        className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-right shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="%"
                      />
                      <span className="text-xs text-gray-500 w-3">%</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 ml-auto whitespace-nowrap">
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
                  </div>
                </td>
              </tr>

              {/* 영업이익 (외부매입 미반영) */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">영업이익</td>
                <td className="px-4 py-3 bg-gradient-to-r from-green-200 to-green-100 border-l-4 border-l-green-700 shadow-md">
                  <p className="text-xl font-bold text-green-900 text-right">
                    {formatCurrency(vrbData.bestCase.operatingProfit1, "KRW")}
                  </p>
                </td>
                <td className="px-4 py-3 bg-gray-100">
                  <p className="text-lg font-semibold text-gray-700 text-right">
                    {formatCurrency(vrbData.worstCase.operatingProfit1, "KRW")}
                  </p>
                </td>
              </tr>

              {/* 영업이익률 (외부매입 미반영) */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">영업이익률</td>
                <td className="px-4 py-3 bg-gradient-to-r from-green-200 to-green-100 border-l-4 border-l-green-700 shadow-md">
                  <p className="text-xl font-bold text-green-900 text-right">
                    {vrbData.bestCase.operatingProfit1Percent.toFixed(2)}%
                  </p>
                </td>
                <td className="px-4 py-3 bg-gray-100">
                  <p className="text-lg font-semibold text-gray-700 text-right">
                    {vrbData.worstCase.operatingProfit1Percent.toFixed(2)}%
                  </p>
                </td>
              </tr>

              {/* 영업이익 (외부매입1 반영) - 체크박스가 체크된 경우에만 표시 */}
              {vrbData.bestCase.includeExternalPurchase && (
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-l-4 border-l-blue-400">영업이익 (외부매입1 반영)</td>
                  <td className="px-4 py-3 bg-blue-50 border-l-4 border-l-blue-600 shadow-sm">
                    <p className="text-xl font-bold text-blue-900 text-right">
                      {formatCurrency(vrbData.bestCase.operatingProfitEP1, "KRW")}
                    </p>
                    <p className="text-sm font-medium text-blue-700 text-right">
                      {vrbData.bestCase.operatingProfitEP1Percent.toFixed(2)}%
                    </p>
                  </td>
                  <td className="px-4 py-3 bg-gray-50">
                    <p className="text-lg font-semibold text-gray-700 text-right">
                      {formatCurrency(vrbData.worstCase.operatingProfitEP1, "KRW")}
                    </p>
                    <p className="text-sm text-gray-500 text-right">
                      {vrbData.worstCase.operatingProfitEP1Percent.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              )}

              {/* 영업이익 (외부매입2 반영) - 체크박스가 체크된 경우에만 표시 */}
              {vrbData.bestCase.includeExternalPurchase2 && (
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-l-4 border-l-purple-400">영업이익 (외부매입1,2 반영)</td>
                  <td className="px-4 py-3 bg-purple-50 border-l-4 border-l-purple-600 shadow-sm">
                    <p className="text-xl font-bold text-purple-900 text-right">
                      {formatCurrency(vrbData.bestCase.operatingProfitEP2, "KRW")}
                    </p>
                    <p className="text-sm font-medium text-purple-700 text-right">
                      {vrbData.bestCase.operatingProfitEP2Percent.toFixed(2)}%
                    </p>
                  </td>
                  <td className="px-4 py-3 bg-gray-50">
                    <p className="text-lg font-semibold text-gray-700 text-right">
                      {formatCurrency(vrbData.worstCase.operatingProfitEP2, "KRW")}
                    </p>
                    <p className="text-sm text-gray-500 text-right">
                      {vrbData.worstCase.operatingProfitEP2Percent.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              )}

              {/* 최종 영업이익 안내 (외부매입이 하나라도 체크된 경우 요약으로 한 번 더 강조 가능하지만, 위에서 각각 보여주므로 생략 가능) */}
              {/* 만약 외부매입이 아예 없는 경우는 기본 영업이익만 표시됨. */}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사업 진행근거 및 기대효과 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">사업 진행근거 및 기대효과</h2>
        <textarea
          value={vrbData.businessBasis}
          onChange={(e) => setVrbData({ ...vrbData, businessBasis: e.target.value })}
          onMouseUp={(e: any) => handleHeightChange('businessBasis', e.target.offsetHeight)}
          style={{ height: vrbData.uiSettings?.heights?.['businessBasis'] ? `${vrbData.uiSettings.heights['businessBasis']}px` : undefined }}
          rows={6}
          disabled={isReadOnly}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y"
          placeholder="사업 진행근거 및 기대효과를 입력하세요"
        />
      </div>

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

      {/* 하단 저장 버튼 */}
      {
        (vrbStatus !== 'COMPLETED') && (
          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              저장
            </button>
          </div>
        )
      }

      {/* 승인/반려 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setIsRejectionModalOpen(true)}
          disabled={vrbStatus === 'COMPLETED'}
          className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="h-4 w-4" />
          반려
        </button>
        <button
          onClick={() => setIsApprovalModalOpen(true)}
          disabled={vrbStatus === 'COMPLETED'}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-4 w-4" />
          승인
        </button>
      </div>

      {/* 승인 확인 모달 */}
      {
        isApprovalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">VRB Review 승인</h3>
              <p className="text-sm text-gray-600 mb-6">
                이 VRB Review를 승인하시겠습니까?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
                >
                  승인
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 반려 모달 */}
      {
        isRejectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">VRB Review 반려</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="반려 사유를 입력해주세요"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsRejectionModalOpen(false);
                    setRejectionReasonInput("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  반려
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
