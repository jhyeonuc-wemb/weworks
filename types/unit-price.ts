// 기준단가 관련 타입 정의

export interface UnitPrice {
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
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitPriceFormData {
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
  isActive: boolean;
  displayOrder: number;
}

export interface GroupAverage {
  affiliationGroup: string;
  averageProposedApplied: number;
  averageProposedDiscountRate: number;
  averageInternalApplied: number;
  averageIncreaseRate: number | null;
}
