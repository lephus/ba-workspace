import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiKeysApi,
  addApiKeyApi,
  deleteApiKeyApi,
  toggleApiKeyApi,
  validateApiKeyApi,
  setActiveKeyApi,
} from "./api";
import type { AddApiKeyInput } from "./types";

const QUERY_KEY = ["api-keys"];

export function useApiKeys() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getApiKeysApi,
    select: (data) => data,
  });
}

export function useAddApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddApiKeyInput) => addApiKeyApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: number) => deleteApiKeyApi(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useToggleApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, isActive }: { keyId: number; isActive: boolean }) =>
      toggleApiKeyApi(keyId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useValidateApiKey() {
  return useMutation({
    mutationFn: (key: string) => validateApiKeyApi(key),
  });
}

export function useSetActiveKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setActiveKeyApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["rate-limit"] });
    },
  });
}
