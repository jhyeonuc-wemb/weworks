// 프로젝트 API 서비스

import type { Project } from "@/types/profitability";

export class ProjectService {
  /**
   * 프로젝트 상세 조회
   */
  static async fetchById(id: number): Promise<Project | null> {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      return data.project || null;
    } catch (error) {
      console.error("Error fetching project:", error);
      return null;
    }
  }

  /**
   * 프로젝트 목록 조회
   */
  static async fetchList(params?: {
    status?: string;
    search?: string;
  }): Promise<Project[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append("status", params.status);
      if (params?.search) searchParams.append("search", params.search);

      const response = await fetch(`/api/projects?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }
}
