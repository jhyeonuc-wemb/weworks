// 수지분석서 관련 타입 정의

export interface Project {
  id: number;
  name: string;
  code?: string;
  currency: "KRW" | "USD" | "EUR" | "JPY";
  contractStartDate: string | null;
  contractEndDate: string | null;
  customerName?: string;
  projectCode?: string;
}

export interface ProjectUnitPrice {
  id: number;
  affiliationGroup: string;
  jobGroup: string;
  jobLevel: string;
  grade: string;
  year: number;
  proposedStandard: number | null;
  proposedApplied: number | null;
  proposedDiscountRate: number | null;
  internalApplied: number | null;
  internalIncreaseRate: number | null;
}

export type ProductType = "자사" | "타사";
export type RequestType = "" | "예정" | "계약(정상)" | "계약(변경)" | "취소";

export interface ProductPlanItem {
  id: number;
  type: ProductType;
  productId?: number | null;
  companyName: string;
  productName: string;
  quantity: number | null;
  unitPrice: number | null;
  basePrice: number;
  proposalPrice: number | null;
  costPrice: number | null; // 원가 (매입, 천원)
  discountRate: number;
  requestDate: string;
  requestType: RequestType;
  contractCostPrice: number | null; // 구매 계약 원가 (천원)
}

export interface TeamAssignment {
  id: number;
  userId: number;
  userName: string;
  rankName: string;
  departmentName: string;
  role: string;
  affiliationGroup: string;
  jobGroup: string;
  grade: string;
  startDate: string;
  endDate: string | null;
  allocationPercentage: number;
}

export interface ManpowerPlanItem {
  id: number;
  projectName: string; // 업무영역
  role: string; // 역할
  detailedTask: string; // 세부업무
  companyName: string; // 회사명
  affiliationGroup: string; // 소속 및 직군
  wmbRank: string; // 위엠비 직급
  grade: string; // 등급
  name: string; // 성명
  userId: number | null; // 사용자 ID (선택시)
  monthlyAllocation: { [month: string]: number }; // 월별 투입 M/M
  proposedUnitPrice: number | null; // 제안가 단가 (천원)
  proposedAmount: number | null; // 제안가 금액 (천원, 수동 입력 가능)
  internalUnitPrice: number | null; // 내부단가 (천원)
  internalAmount: number | null; // 내부단가 금액 (천원, 수동 입력 가능)
}

export interface ProductMasterItem {
  id: number;
  companyName: string;
  productName: string;
  unitPrice: number;
  isActive?: boolean;
}

export interface StandardExpense {
  id: number;
  item: string;
  category: string | null;
  standardType: string | null;
  standardDetail: string;
  inputValue: number | null;
  calculatedValue: number | null;
  finalAmount: number;
}

export interface ProfitabilityFormData {
  softwareRevenue: number;
  hardwareRevenue: number;
  laborCost: number;
  otherCost: number;
}

export interface ProductPlanSubtotal {
  base: number;
  proposal: number;
  discountRate: number;
}

export interface ProfitabilityHeader {
  id: number;
  projectId: number;
  version: number;
  status: "draft" | "review" | "approved" | "rejected" | "completed";
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitRate: number;
  createdAt: string;
  updated_at: string;
}

export interface ProjectExpenseItem {
  id: number;
  category: string;
  item: string;
  monthlyValues: { [month: string]: number };
  isAutoCalculated: boolean;
}
