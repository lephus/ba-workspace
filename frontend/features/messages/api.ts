import { APP_CONFIG } from "@/config/app";
import type {
  Message,
  SendMessageInput,
  SendMessageResponse,
  PinnedMessage,
} from "./types";

const API_URL = APP_CONFIG.API_URL;

// GET /projects/:projectId/conversations/:conversationId/messages
export async function getMessagesApi(
  projectId: number,
  conversationId: number
): Promise<Message[]> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    throw new Error("Không thể tải tin nhắn");
  }

  return response.json();
}

// POST /projects/:projectId/conversations/:conversationId/messages
export async function sendMessageApi(
  projectId: number,
  conversationId: number,
  data: SendMessageInput
): Promise<SendMessageResponse> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    if (response.status === 500) {
      throw new Error("Agent xử lý thất bại. Vui lòng thử lại.");
    }
    throw new Error("Không thể gửi tin nhắn");
  }

  return response.json();
}

// GET /projects/:projectId/conversations/:conversationId/pinned-messages
export async function getPinnedMessagesApi(
  projectId: number,
  conversationId: number
): Promise<PinnedMessage[]> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}/pinned-messages`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy cuộc hội thoại");
    }
    throw new Error("Không thể tải danh sách tin nhắn đã ghim");
  }

  return response.json();
}

// POST /projects/:projectId/conversations/:conversationId/messages/:messageId/pin
export async function pinMessageApi(
  projectId: number,
  conversationId: number,
  messageId: number
): Promise<PinnedMessage> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}/messages/${messageId}/pin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy tin nhắn");
    }
    if (response.status === 409) {
      throw new Error("Tin nhắn đã được ghim");
    }
    throw new Error("Không thể ghim tin nhắn");
  }

  return response.json();
}

// DELETE /projects/:projectId/conversations/:conversationId/messages/:messageId/pin
export async function unpinMessageApi(
  projectId: number,
  conversationId: number,
  messageId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/conversations/${conversationId}/messages/${messageId}/pin`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy ghim tin nhắn");
    }
    throw new Error("Không thể bỏ ghim tin nhắn");
  }
}
