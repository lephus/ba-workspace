"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProjectsApi,
  getProjectApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "./api";
import type { CreateProjectInput, UpdateProjectInput } from "./schema";

const PROJECTS_QUERY_KEY = ["projects"];

// Hook lấy danh sách projects
export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: getProjectsApi,
  });
}

// Hook lấy project theo ID
export function useProject(projectId: number) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, projectId],
    queryFn: () => getProjectApi(projectId),
    enabled: !!projectId,
  });
}

// Hook tạo project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) => createProjectApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      toast.success("Tạo dự án thành công!");
    },
    onError: (error: Error) => {
      console.error("Error creating project:", error);
      toast.error(error.message || "Tạo dự án thất bại");
    },
  });
}

// Hook cập nhật project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: number;
      data: UpdateProjectInput;
    }) => updateProjectApi(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      toast.success("Cập nhật dự án thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cập nhật dự án thất bại");
    },
  });
}

// Hook xóa project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => deleteProjectApi(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      toast.success("Xóa dự án thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa dự án thất bại");
    },
  });
}
