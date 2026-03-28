"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getConversationsApi,
  getConversationApi,
  createConversationApi,
  updateConversationApi,
  deleteConversationApi,
  deleteMultipleConversationsApi,
  pinConversationApi,
  unpinConversationApi,
} from "./api";
import type {
  CreateConversationInput,
  UpdateConversationInput,
} from "./schema";

function conversationsKey(projectId: number) {
  return ["projects", projectId, "conversations"];
}

// Hook lấy danh sách conversations
export function useConversations(projectId: number) {
  return useQuery({
    queryKey: conversationsKey(projectId),
    queryFn: () => getConversationsApi(projectId),
    enabled: !!projectId,
  });
}

// Hook lấy conversation theo ID
export function useConversation(projectId: number, conversationId: number) {
  return useQuery({
    queryKey: [...conversationsKey(projectId), conversationId],
    queryFn: () => getConversationApi(projectId, conversationId),
    enabled: !!projectId && !!conversationId,
  });
}

// Hook tạo conversation
export function useCreateConversation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationInput) =>
      createConversationApi(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success("Tạo cuộc hội thoại thành công!");
    },
    onError: (error: Error) => {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Tạo cuộc hội thoại thất bại");
    },
  });
}

// Hook cập nhật conversation
export function useUpdateConversation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: number;
      data: UpdateConversationInput;
    }) => updateConversationApi(projectId, conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success("Cập nhật cuộc hội thoại thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cập nhật cuộc hội thoại thất bại");
    },
  });
}

// Hook xóa conversation
export function useDeleteConversation(projectId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params.conversationId
    ? Number(params.conversationId)
    : null;

  return useMutation({
    mutationFn: (conversationId: number) =>
      deleteConversationApi(projectId, conversationId),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success("Xóa cuộc hội thoại thành công!");

      // If the deleted conversation is the one currently being viewed, navigate back
      if (activeConversationId && deletedId === activeConversationId) {
        router.push(`/projects/${projectId}/conversations`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa cuộc hội thoại thất bại");
    },
  });
}

// Hook xóa nhiều conversations
export function useDeleteMultipleConversations(projectId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params.conversationId
    ? Number(params.conversationId)
    : null;

  return useMutation({
    mutationFn: (conversationIds: number[]) =>
      deleteMultipleConversationsApi(projectId, conversationIds),
    onSuccess: (_data, deletedIds) => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success(`Đã xóa ${_data.deleted} cuộc hội thoại!`);

      // If the active conversation was in the deleted list, navigate back
      if (activeConversationId && deletedIds.includes(activeConversationId)) {
        router.push(`/projects/${projectId}/conversations`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa các cuộc hội thoại thất bại");
    },
  });
}

// Hook ghim/bỏ ghim conversation
export function useTogglePinConversation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      pinned,
    }: {
      conversationId: number;
      pinned: boolean;
    }) =>
      pinned
        ? pinConversationApi(projectId, conversationId, true)
        : unpinConversationApi(projectId, conversationId),
    onSuccess: (_, { pinned }) => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success(
        pinned ? "Đã ghim cuộc hội thoại" : "Đã bỏ ghim cuộc hội thoại",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Thao tác ghim thất bại");
    },
  });
}
