import { APP_CONFIG } from "@/config/app";
import type { Project } from "./types";
import type { CreateProjectInput, UpdateProjectInput } from "./schema";

const API_URL = APP_CONFIG.API_URL;

// GET /projects - List all projects
export async function getProjectsApi(): Promise<Project[]> {
  const response = await fetch(`${API_URL}/projects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách dự án");
  }

  return response.json();
}

// GET /projects/:id - Get project by ID
export async function getProjectApi(projectId: number): Promise<Project> {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể tải thông tin dự án");
  }

  return response.json();
}

// POST /projects - Create a new project
export async function createProjectApi(
  data: CreateProjectInput
): Promise<Project> {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });


  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Tên dự án là bắt buộc");
    }
    throw new Error("Không thể tạo dự án");
  }

  return response.json();
}

// PUT /projects/:id - Update project
export async function updateProjectApi(
  projectId: number,
  data: UpdateProjectInput
): Promise<Project> {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    if (response.status === 400) {
      throw new Error("Dữ liệu không hợp lệ");
    }
    throw new Error("Không thể cập nhật dự án");
  }

  return response.json();
}

// DELETE /projects/:id - Delete project
export async function deleteProjectApi(projectId: number): Promise<void> {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể xóa dự án");
  }
}
