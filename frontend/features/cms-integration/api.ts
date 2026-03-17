import { APP_CONFIG } from "@/config/app";
import type {
  CmsConnection,
  CmsDataset,
  CreateConnectionInput,
  PayloadCollection,
  SyncCollectionInput,
  TestConnectionResult,
  UpdateConnectionInput,
} from "./types";

const API_URL = APP_CONFIG.API_URL;

// ── Connections ────────────────────────────────────────────────────────

export async function getConnectionsApi(
  projectId: number,
): Promise<CmsConnection[]> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections`,
    { headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error("Không thể tải danh sách CMS connections");
  return res.json();
}

export async function createConnectionApi(
  projectId: number,
  data: CreateConnectionInput,
): Promise<CmsConnection> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể tạo CMS connection");
  }
  return res.json();
}

export async function updateConnectionApi(
  projectId: number,
  connectionId: number,
  data: UpdateConnectionInput,
): Promise<CmsConnection> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/${connectionId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể cập nhật CMS connection");
  }
  return res.json();
}

export async function deleteConnectionApi(
  projectId: number,
  connectionId: number,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/${connectionId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể xoá CMS connection");
  }
}

export async function testConnectionApi(
  projectId: number,
  connectionId: number,
): Promise<TestConnectionResult> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/${connectionId}/test`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Không thể kiểm tra kết nối");
  return res.json();
}

export async function testConnectionPreviewApi(
  projectId: number,
  data: { base_url: string; api_key?: string },
): Promise<TestConnectionResult> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/test-preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error("Không thể kiểm tra kết nối");
  return res.json();
}

// ── Collections ────────────────────────────────────────────────────────

export async function listCollectionsApi(
  projectId: number,
  connectionId: number,
): Promise<PayloadCollection[]> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/${connectionId}/collections`,
    { headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể tải danh sách collections");
  }
  return res.json();
}

export async function syncCollectionApi(
  projectId: number,
  connectionId: number,
  data: SyncCollectionInput,
): Promise<CmsDataset> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/connections/${connectionId}/sync`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể đồng bộ collection");
  }
  return res.json();
}

// ── Datasets ───────────────────────────────────────────────────────────

export async function getDatasetsApi(
  projectId: number,
): Promise<CmsDataset[]> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/datasets`,
    { headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error("Không thể tải danh sách datasets");
  return res.json();
}

export async function getDatasetApi(
  projectId: number,
  datasetId: number,
): Promise<CmsDataset> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/datasets/${datasetId}`,
    { headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error("Không thể tải dataset");
  return res.json();
}

export async function deleteDatasetApi(
  projectId: number,
  datasetId: number,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/cms/datasets/${datasetId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Không thể xoá dataset");
  }
}
