import { APP_CONFIG } from "@/config/app";
import type { Message, SendMessageInput, SendMessageResponse } from "./types";

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
