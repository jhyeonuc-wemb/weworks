// 프로젝트 관련 커스텀 훅

import { useState, useEffect } from "react";
import type { Project } from "@/types/profitability";
import { ProjectService } from "@/services/project.service";

/**
 * 프로젝트 상세 정보 조회 훅
 */
export function useProject(projectId: number | string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ProjectService.fetchById(Number(projectId));
        setProject(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("프로젝트 조회 실패");
        setError(error);
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const refetch = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await ProjectService.fetchById(Number(projectId));
      setProject(data);
    } catch (err) {
      console.error("Error refetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    project,
    loading,
    error,
    refetch,
  };
}

/**
 * 프로젝트 목록 조회 훅
 */
export function useProjects(filters?: { status?: string; search?: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ProjectService.fetchList(filters);
        setProjects(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("프로젝트 목록 조회 실패");
        setError(error);
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters?.status, filters?.search]);

  return {
    projects,
    loading,
    error,
  };
}
