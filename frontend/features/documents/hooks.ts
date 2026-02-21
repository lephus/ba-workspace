"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
} from "./api";
import type { UploadDocumentInput } from "./types";

function documentsKey(projectId: number) {
  return ["projects", projectId, "documents"];
}

// Hook lấy danh sách documents
export function useDocuments(projectId: number) {
  return useQuery({
    queryKey: documentsKey(projectId),
    queryFn: () => getDocumentsApi(projectId),
    enabled: !!projectId,
  });
}

// Hook upload document
export function useUploadDocument(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadDocumentInput) =>
      uploadDocumentApi(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: documentsKey(projectId),
      });
      toast.success("Tải lên tài liệu thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Tải lên tài liệu thất bại");
    },
  });
}

// Hook xóa document
export function useDeleteDocument(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      deleteDocumentApi(projectId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: documentsKey(projectId),
      });
      toast.success("Xóa tài liệu thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa tài liệu thất bại");
    },
  });
}
