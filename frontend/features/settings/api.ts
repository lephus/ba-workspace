import { APP_CONFIG } from "@/config/app";
import type { ApiKey, AddApiKeyInput, ValidateKeyResult } from "./types";

const API_URL = APP_CONFIG.API_URL;

// GET /settings/api-keys
export async function getApiKeysApi(): Promise<ApiKey[]> {
  const response = await fetch(`${API_URL}/settings/api-keys`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Không thể tải danh sách API keys");
  }
  return response.json();
}

// POST /settings/api-keys
export async function addApiKeyApi(data: AddApiKeyInput): Promise<ApiKey> {
  const response = await fetch(`${API_URL}/settings/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || "Không thể thêm API key");
  }
  return response.json();
}

// DELETE /settings/api-keys/:id
export async function deleteApiKeyApi(keyId: number): Promise<void> {
  const response = await fetch(`${API_URL}/settings/api-keys/${keyId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || "Không thể xoá API key");
  }
}

// PATCH /settings/api-keys/:id/toggle
export async function toggleApiKeyApi(
  keyId: number,
  isActive: boolean,
): Promise<ApiKey> {
  const response = await fetch(`${API_URL}/settings/api-keys/${keyId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Lỗi không xác định" }));
    throw new Error(err.error || "Không thể cập nhật API key");
  }
  return response.json();
}

// POST /settings/api-keys/validate
export async function validateApiKeyApi(
  key: string,
): Promise<ValidateKeyResult> {
  const response = await fetch(`${API_URL}/settings/api-keys/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!response.ok) {
    throw new Error("Không thể kiểm tra API key");
  }
  return response.json();
}
