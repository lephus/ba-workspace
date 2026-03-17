// CMS Integration types

export interface CmsConnection {
  id: number;
  project_id: number;
  name: string;
  base_url: string;
  api_key_masked: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateConnectionInput {
  name: string;
  base_url: string;
  api_key?: string;
}

export interface UpdateConnectionInput {
  name?: string;
  base_url?: string;
  api_key?: string;
  is_active?: boolean;
}

export interface PayloadCollection {
  slug: string;
  label: string;
  totalDocs?: number;
}

export interface SyncCollectionInput {
  collection_slug: string;
  limit?: number;
}

export interface CmsDataset {
  id: number;
  project_id: number;
  connection_id: number;
  collection_slug: string;
  record_count: number;
  synced_at: string | null;
  created_at: string | null;
  data?: Record<string, unknown>[];
}

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
}
