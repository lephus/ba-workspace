"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMessagesApi,
  sendMessageApi,
  getPinnedMessagesApi,
  pinMessageApi,
  unpinMessageApi,
} from "./api";
import type {
  Message,
  SendMessageInput,
  SendMessageResponse,
  PinnedMessage,
} from "./types";

function messagesKey(projectId: number, conversationId: number) {
  return ["projects", projectId, "conversations", conversationId, "messages"];
}

function pinnedMessagesKey(projectId: number, conversationId: number) {
  return [
    "projects",
    projectId,
    "conversations",
    conversationId,
    "pinned-messages",
  ];
}

// Hook lấy danh sách messages
export function useMessages(projectId: number, conversationId: number) {
  return useQuery({
    queryKey: messagesKey(projectId, conversationId),
    queryFn: () => getMessagesApi(projectId, conversationId),
    enabled: !!projectId && !!conversationId,
  });
}

// Hook gửi message (tự động nhận assistant reply)
export function useSendMessage(projectId: number, conversationId: number) {
  const queryClient = useQueryClient();
  const key = messagesKey(projectId, conversationId);

  return useMutation({
    mutationFn: (data: SendMessageInput) =>
      sendMessageApi(projectId, conversationId, data),
    onMutate: async (data: SendMessageInput) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Message[]>(key);

      // Build a temporary user message shown immediately
      const optimisticContent =
        typeof data.content === "string"
          ? data.content
          : data.content.parts.join("\n");

      const optimisticMsg: Message = {
        id: Date.now(), // temp id
        conversation_id: conversationId,
        role: "user",
        content: optimisticContent,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(key, (old) =>
        [...(old ?? []), optimisticMsg]
      );

      return { previous };
    },
    onSuccess: (response: SendMessageResponse) => {
      // Replace optimistic data with real server data
      queryClient.setQueryData<Message[]>(key, (old) => {
        // Remove the optimistic user message (temp id) and append server messages
        const withoutOptimistic = (old ?? []).filter(
          (m) => m.id !== response.message.id && m.id >= 1e12
            ? false // remove temp messages
            : true
        );
        // Simpler: keep all real messages, remove temp ones, then append server response
        const real = (old ?? []).filter((m) => m.id < 1e12);
        const result = [...real, response.message];
        if (response.assistant_message) {
          result.push(response.assistant_message);
        }
        return result;
      });
    },
    onError: (_error: Error, _data, context) => {
      // Rollback to previous state
      if (context?.previous) {
        queryClient.setQueryData<Message[]>(key, context.previous);
      }
      toast.error(_error.message || "Gửi tin nhắn thất bại");
    },
  });
}

// Hook lấy danh sách pinned messages
export function usePinnedMessages(
  projectId: number,
  conversationId: number
) {
  return useQuery({
    queryKey: pinnedMessagesKey(projectId, conversationId),
    queryFn: () => getPinnedMessagesApi(projectId, conversationId),
    enabled: !!projectId && !!conversationId,
  });
}

// Hook ghim tin nhắn
export function usePinMessage(projectId: number, conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) =>
      pinMessageApi(projectId, conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pinnedMessagesKey(projectId, conversationId),
      });
      toast.success("Đã ghim tin nhắn");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ghim tin nhắn thất bại");
    },
  });
}

// Hook bỏ ghim tin nhắn
export function useUnpinMessage(projectId: number, conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) =>
      unpinMessageApi(projectId, conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pinnedMessagesKey(projectId, conversationId),
      });
      toast.success("Đã bỏ ghim tin nhắn");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bỏ ghim tin nhắn thất bại");
    },
  });
}
