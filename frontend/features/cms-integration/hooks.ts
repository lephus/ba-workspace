"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConnectionsApi,
  createConnectionApi,
  updateConnectionApi,
  deleteConnectionApi,
  testConnectionApi,
  testConnectionPreviewApi,
  listCollectionsApi,
  syncCollectionApi,
  getDatasetsApi,
  getDatasetApi,
  deleteDatasetApi,
} from "./api";
import type { CreateConnectionInput, SyncCollectionInput, UpdateConnectionInput } from "./types";

// ── Query keys ─────────────────────────────────────────────────────────

function connectionsKey(projectId: number) {
  return ["projects", projectId, "cms-connections"];
}

function collectionsKey(projectId: number, connectionId: number) {
  return ["projects", projectId, "cms-collections", connectionId];
}

function datasetsKey(projectId: number) {
  return ["projects", projectId, "cms-datasets"];
}

function datasetKey(projectId: number, datasetId: number) {
  return ["projects", projectId, "cms-datasets", datasetId];
}

// ── Connections ────────────────────────────────────────────────────────

export function useConnections(projectId: number) {
  return useQuery({
    queryKey: connectionsKey(projectId),
    queryFn: () => getConnectionsApi(projectId),
    enabled: !!projectId,
  });
}

export function useCreateConnection(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConnectionInput) =>
      createConnectionApi(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionsKey(projectId) });
      toast.success("Tạo CMS connection thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Tạo CMS connection thất bại");
    },
  });
}

export function useUpdateConnection(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      data,
    }: {
      connectionId: number;
      data: UpdateConnectionInput;
    }) => updateConnectionApi(projectId, connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionsKey(projectId) });
      toast.success("Cập nhật CMS connection thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cập nhật CMS connection thất bại");
    },
  });
}

export function useDeleteConnection(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: number) =>
      deleteConnectionApi(projectId, connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionsKey(projectId) });
      queryClient.invalidateQueries({ queryKey: datasetsKey(projectId) });
      toast.success("Xoá CMS connection thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xoá CMS connection thất bại");
    },
  });
}

export function useTestConnection(projectId: number) {
  return useMutation({
    mutationFn: (connectionId: number) =>
      testConnectionApi(projectId, connectionId),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Kết nối CMS thành công!");
      } else {
        toast.error(result.error || "Kết nối CMS thất bại");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kiểm tra kết nối thất bại");
    },
  });
}

export function useTestConnectionPreview(projectId: number) {
  return useMutation({
    mutationFn: (data: { base_url: string; api_key?: string }) =>
      testConnectionPreviewApi(projectId, data),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Kết nối CMS thành công!");
      } else {
        toast.error(result.error || "Kết nối CMS thất bại");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kiểm tra kết nối thất bại");
    },
  });
}

// ── Collections ────────────────────────────────────────────────────────

export function useCollections(
  projectId: number,
  connectionId: number | null,
) {
  return useQuery({
    queryKey: collectionsKey(projectId, connectionId ?? 0),
    queryFn: () => listCollectionsApi(projectId, connectionId!),
    enabled: !!projectId && !!connectionId,
  });
}

export function useSyncCollection(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      data,
    }: {
      connectionId: number;
      data: SyncCollectionInput;
    }) => syncCollectionApi(projectId, connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKey(projectId) });
      toast.success("Đồng bộ collection thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Đồng bộ collection thất bại");
    },
  });
}

// ── Datasets ───────────────────────────────────────────────────────────

export function useDatasets(projectId: number) {
  return useQuery({
    queryKey: datasetsKey(projectId),
    queryFn: () => getDatasetsApi(projectId),
    enabled: !!projectId,
  });
}

export function useDataset(projectId: number, datasetId: number | null) {
  return useQuery({
    queryKey: datasetKey(projectId, datasetId ?? 0),
    queryFn: () => getDatasetApi(projectId, datasetId!),
    enabled: !!projectId && !!datasetId,
  });
}

export function useDeleteDataset(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datasetId: number) =>
      deleteDatasetApi(projectId, datasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetsKey(projectId) });
      toast.success("Xoá dataset thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xoá dataset thất bại");
    },
  });
}
