import { APP_CONFIG } from "@/config/app";
import type { Conversation } from "./types";
import type {
  CreateConversationInput,
  UpdateConversationInput,
} from "./schema";

const API_URL = APP_CONFIG.API_URL;

// GET /projects/:projectId/conversations
export async function getConversationsApi(
  projectId: number
): Promise<Conversation[]> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể tải danh sách cuộc hội thoại");
  }

  return response.json();
}

// GET /projects/:projectId/conversations/:conversationId
export async function getConversationApi(
  projectId: number,
  conversationId: number
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    throw new Error("Không thể tải thông tin cuộc hội thoại");
  }

  return response.json();
}

// POST /projects/:projectId/conversations
export async function createConversationApi(
  projectId: number,
  data: CreateConversationInput
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể tạo cuộc hội thoại");
  }

  return response.json();
}

// PUT /projects/:projectId/conversations/:conversationId
export async function updateConversationApi(
  projectId: number,
  conversationId: number,
  data: UpdateConversationInput
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    throw new Error("Không thể cập nhật cuộc hội thoại");
  }

  return response.json();
}

// DELETE /projects/:projectId/conversations/:conversationId
export async function deleteConversationApi(
  projectId: number,
  conversationId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    throw new Error("Không thể xóa cuộc hội thoại");
  }
}
