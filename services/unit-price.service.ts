// 기준단가 API 서비스

import type { UnitPrice, UnitPriceFormData } from "@/types/unit-price";

export class UnitPriceService {
  /**
   * 기준단가 목록 조회
   */
  static async fetchList(params?: {
    year?: number;
    affiliationGroup?: string;
    isActive?: boolean;
  }): Promise<UnitPrice[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.year) searchParams.append("year", String(params.year));
      if (params?.affiliationGroup)
        searchParams.append("affiliationGroup", params.affiliationGroup);
      if (params?.isActive !== undefined)
        searchParams.append("isActive", String(params.isActive));

      const response = await fetch(`/api/unit-prices?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unit prices");
      }

      const data = await response.json();
      return data.unitPrices || [];
    } catch (error) {
      console.error("Error fetching unit prices:", error);
      throw error;
    }
  }

  /**
   * 기준단가 생성
   */
  static async create(
    unitPrice: Omit<UnitPriceFormData, "displayOrder">
  ): Promise<UnitPrice> {
    try {
      const response = await fetch("/api/unit-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitPrice),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create unit price");
      }

      const data = await response.json();
      return data.unitPrice;
    } catch (error) {
      console.error("Error creating unit price:", error);
      throw error;
    }
  }

  /**
   * 기준단가 수정
   */
  static async update(
    id: number,
    unitPrice: Partial<UnitPriceFormData>
  ): Promise<UnitPrice> {
    try {
      const response = await fetch(`/api/unit-prices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitPrice),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update unit price");
      }

      const data = await response.json();
      return data.unitPrice;
    } catch (error) {
      console.error("Error updating unit price:", error);
      throw error;
    }
  }

  /**
   * 기준단가 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/unit-prices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete unit price");
      }
    } catch (error) {
      console.error("Error deleting unit price:", error);
      throw error;
    }
  }

  /**
   * 연도별 기준단가 복사
   */
  static async copyYear(
    sourceYear: number,
    targetYear: number
  ): Promise<void> {
    try {
      const response = await fetch("/api/unit-prices/copy-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceYear, targetYear }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to copy unit prices");
      }
    } catch (error) {
      console.error("Error copying unit prices:", error);
      throw error;
    }
  }
}
