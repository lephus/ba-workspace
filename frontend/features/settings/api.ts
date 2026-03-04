import { APP_CONFIG } from "@/config/app";
import type { AddApiKeyInput, ApiKey, ValidateApiKeyResult } from "./types";

const API_URL = APP_CONFIG.API_URL;

export async function getApiKeysApi(): Promise<ApiKey[]> {
  const res = await fetch(`${API_URL}/api-keys`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Không thể tải danh sách API keys");
  return res.json();
}

export async function addApiKeyApi(data: AddApiKeyInput): Promise<ApiKey> {
  const res = await fetch(`${API_URL}/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể thêm API key");
  }
  return res.json();
}

export async function deleteApiKeyApi(keyId: number): Promise<void> {
  const res = await fetch(`${API_URL}/api-keys/${keyId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể xoá API key");
  }
}

export async function toggleApiKeyApi(
  keyId: number,
  isActive: boolean,
): Promise<ApiKey> {
  const res = await fetch(`${API_URL}/api-keys/${keyId}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể cập nhật API key");
  }
  return res.json();
}

export async function validateApiKeyApi(
  key: string,
): Promise<ValidateApiKeyResult> {
  const res = await fetch(`${API_URL}/api-keys/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error("Không thể kiểm tra API key");
  return res.json();
}
