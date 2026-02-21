"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMessagesApi, sendMessageApi } from "./api";
import type { Message, SendMessageInput, SendMessageResponse } from "./types";

function messagesKey(projectId: number, conversationId: number) {
  return ["projects", projectId, "conversations", conversationId, "messages"];
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

  return useMutation({
    mutationFn: (data: SendMessageInput) =>
      sendMessageApi(projectId, conversationId, data),
    onSuccess: (response: SendMessageResponse) => {
      // Optimistic: append both user + assistant messages to cache
      queryClient.setQueryData<Message[]>(
        messagesKey(projectId, conversationId),
        (old) => {
          const messages = old ? [...old] : [];
          messages.push(response.message);
          if (response.assistant_message) {
            messages.push(response.assistant_message);
          }
          return messages;
        }
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gửi tin nhắn thất bại");
    },
  });
}
