// 수지분석서 API 서비스

import type {
  ProfitabilityHeader,
  StandardExpense,
  ProjectUnitPrice,
} from "@/types/profitability";

export class ProfitabilityService {
  /**
   * 수지분석서 헤더 생성 또는 조회
   */
  static async ensureHeader(projectId: number, versionComment: string = ""): Promise<ProfitabilityHeader | null> {
    try {
      const response = await fetch("/api/profitability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, version_comment: versionComment }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server Response (Non-JSON):", text);
        let errData = {};
        try {
          errData = JSON.parse(text);
        } catch (e) { }
        console.error("Server Error Detail:", errData);
        throw new Error((errData as any).message || "Failed to ensure profitability header");
      }

      const data = await response.json();
      return data.profitability || null;
    } catch (error) {
      console.error("Error ensuring profitability header:", error);
      throw error;
    }
  }

  /**
   * 수지분석서 목록 조회
   */
  static async fetchList(projectId?: number, latestOnly: boolean = false) {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId.toString());
      if (latestOnly) params.append("latestOnly", "true");

      const response = await fetch(`/api/profitability?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profitability list");
      }

      const data = await response.json();
      return data.profitabilities || [];
    } catch (error) {
      console.error("Error fetching profitability list:", error);
      throw error;
    }
  }

  /**
   * 수지분석서 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/profitability/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete profitability");
      }
    } catch (error) {
      console.error("Error deleting profitability:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 기준경비 조회
   */
  static async fetchStandardExpenses(
    projectId: number
  ): Promise<StandardExpense[]> {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/profitability-standard-expenses`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching standard expenses:", error);
      return [];
    }
  }

  /**
   * 프로젝트 기준경비 저장
   */
  static async saveStandardExpenses(
    projectId: number,
    items: Array<{
      rowId: number;
      calculatedValue: number | null;
      finalAmount: number | null;
    }>
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/profitability-standard-expenses`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save standard expenses");
      }
    } catch (error) {
      console.error("Error saving standard expenses:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 기준단가 조회
   */
  static async fetchProjectUnitPrices(
    year: number
  ): Promise<ProjectUnitPrice[]> {
    try {
      const response = await fetch(
        `/api/unit-prices?year=${year}&isActive=true`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch unit prices");
      }

      const data = await response.json();
      const unitPrices = data.unitPrices || [];

      return unitPrices.map((p: any) => ({
        id: Number(p.id),
        affiliationGroup: p.affiliationGroup || p.affiliation_group,
        jobGroup: p.jobGroup || p.job_group,
        jobLevel: p.jobLevel || p.job_level,
        grade: p.grade,
        year: p.year,
        proposedStandard: p.proposedStandard ?? p.proposed_standard ?? null,
        proposedApplied: p.proposedApplied ?? p.proposed_applied ?? null,
        internalApplied: p.internalApplied ?? p.internal_applied ?? null,
      }));
    } catch (error) {
      console.error("Error fetching project unit prices:", error);
      throw error;
    }
  }


  /**
   * 프로젝트 제품계획 조회
   */
  static async fetchProductPlan(projectId: number, profitabilityId?: number) {
    try {
      const url = new URL(`/api/projects/${projectId}/product-plan`, window.location.origin);
      if (profitabilityId) url.searchParams.append("profitabilityId", profitabilityId.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch product plan");
      }
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching product plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 제품계획 저장
   */
  static async saveProductPlan(projectId: number, items: any[], profitabilityId?: number) {
    try {
      const response = await fetch(`/api/projects/${projectId}/product-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, profitabilityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save product plan");
      }
    } catch (error) {
      console.error("Error saving product plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 인력계획 조회
   */
  static async fetchManpowerPlan(projectId: number, profitabilityId?: number) {
    try {
      const url = new URL(`/api/projects/${projectId}/manpower-plan`, window.location.origin);
      if (profitabilityId) url.searchParams.append("profitabilityId", profitabilityId.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch manpower plan");
      }
      const data = await response.json();
      return data; // Return full data including analysis dates
    } catch (error) {
      console.error("Error fetching manpower plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 인력계획 저장
   */
  static async saveManpowerPlan(
    projectId: number,
    items: any[],
    startMonth?: string,
    endMonth?: string,
    profitabilityId?: number
  ) {
    try {
      const response = await fetch(`/api/projects/${projectId}/manpower-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, startMonth, endMonth, profitabilityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save manpower plan");
      }
    } catch (error) {
      console.error("Error saving manpower plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 경비계획 조회
   */
  static async fetchProjectExpensePlan(projectId: number, profitabilityId?: number) {
    try {
      const url = new URL(`/api/projects/${projectId}/expense-plan`, window.location.origin);
      if (profitabilityId) url.searchParams.append("profitabilityId", profitabilityId.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch project expense plan");
      }
      const data = await response.json();
      return data; // Return full object
    } catch (error) {
      console.error("Error fetching project expense plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 경비계획 저장
   */
  static async saveProjectExpensePlan(
    projectId: number,
    items: any[],
    startMonth?: string,
    endMonth?: string,
    profitabilityId?: number
  ) {
    try {
      const response = await fetch(`/api/projects/${projectId}/expense-plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, startMonth, endMonth, profitabilityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save project expense plan");
      }
    } catch (error) {
      console.error("Error saving project expense plan:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 수지차 부가수익 조회
   */
  static async fetchProfitabilityDiff(projectId: number, profitabilityId?: number) {
    try {
      const url = new URL(`/api/projects/${projectId}/profitability-diff`, window.location.origin);
      if (profitabilityId) url.searchParams.append("profitabilityId", profitabilityId.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error Response:", errorText);
        throw new Error(`Failed to fetch profitability diff: ${response.status} ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching profitability diff:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 수지차 부가수익 저장
   */
  static async saveProfitabilityDiff(projectId: number, data: any, profitabilityId?: number) {
    try {
      const response = await fetch(`/api/projects/${projectId}/profitability-diff`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, profitabilityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profitability diff");
      }
      return await response.json();
    } catch (error) {
      console.error("Error saving profitability diff:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 수주품의 조회
   */
  static async fetchOrderProposal(projectId: number, profitabilityId?: number) {
    try {
      const url = new URL(`/api/projects/${projectId}/order-proposal`, window.location.origin);
      if (profitabilityId) url.searchParams.append("profitabilityId", profitabilityId.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch order proposal");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching order proposal:", error);
      throw error;
    }
  }

  /**
   * 프로젝트 수주품의 저장
   */
  static async saveOrderProposal(projectId: number, data: any, profitabilityId?: number) {
    try {
      const response = await fetch(`/api/projects/${projectId}/order-proposal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, profitabilityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order proposal");
      }
      return await response.json();
    } catch (error) {
      console.error("Error saving order proposal:", error);
      throw error;
    }
  }
}
