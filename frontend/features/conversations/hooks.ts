"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getConversationsApi,
  getConversationApi,
  createConversationApi,
  updateConversationApi,
  deleteConversationApi,
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

  return useMutation({
    mutationFn: (conversationId: number) =>
      deleteConversationApi(projectId, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationsKey(projectId),
      });
      toast.success("Xóa cuộc hội thoại thành công!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa cuộc hội thoại thất bại");
    },
  });
}
