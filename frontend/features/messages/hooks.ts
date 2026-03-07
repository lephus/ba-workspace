"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/app";
import {
  getMessagesApi,
  sendMessageApi,
  getPinnedMessagesApi,
  pinMessageApi,
  unpinMessageApi,
} from "./api";
import { getRateLimitApi } from "./rate-limit-api";
import type {
  Message,
  MessagePage,
  SendMessageInput,
  SendMessageResponse,
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

const INITIAL_PAGE_SIZE = 20;
const LOAD_MORE_SIZE = 5;

// Hook lấy danh sách messages (phân trang vô hạn)
export function useMessages(projectId: number, conversationId: number) {
  return useInfiniteQuery({
    queryKey: messagesKey(projectId, conversationId),
    queryFn: ({ pageParam }) =>
      getMessagesApi(projectId, conversationId, {
        before: pageParam ?? undefined,
        limit: pageParam ? LOAD_MORE_SIZE : INITIAL_PAGE_SIZE,
      }),
    initialPageParam: null as number | null,
    getPreviousPageParam: (firstPage) =>
      firstPage.has_more && firstPage.next_cursor != null
        ? firstPage.next_cursor
        : undefined,
    getNextPageParam: () => undefined,
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
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<InfiniteData<MessagePage>>(key);

      const optimisticContent =
        typeof data.content === "string"
          ? data.content
          : data.content.parts.join("\n");

      const optimisticMsg: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        role: "user",
        content: optimisticContent,
        created_at: new Date().toISOString(),
        attachments: data.attachments,
      };

      queryClient.setQueryData<InfiniteData<MessagePage>>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastPage = pages[pages.length - 1];
        pages[pages.length - 1] = {
          ...lastPage,
          messages: [...lastPage.messages, optimisticMsg],
        };
        return { ...old, pages };
      });

      return { previous };
    },
    onSuccess: (response: SendMessageResponse) => {
      queryClient.setQueryData<InfiniteData<MessagePage>>(key, (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastPage = pages[pages.length - 1];
        const realMessages = lastPage.messages.filter((m) => m.id < 1e12);
        const newMessages = [...realMessages, response.message];
        if (response.assistant_message) {
          const assistantMsg = { ...response.assistant_message };
          if (response.export_requested) {
            assistantMsg.export_file = {
              ...response.export_requested,
              download_url: `${APP_CONFIG.API_URL}/projects/${projectId}/exports/${response.export_requested.filename}`,
            };
          }
          newMessages.push(assistantMsg);
        }
        pages[pages.length - 1] = { ...lastPage, messages: newMessages };
        return { ...old, pages };
      });
    },
    onError: (_error: Error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData<InfiniteData<MessagePage>>(
          key,
          context.previous,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["rate-limit"] });
      toast.error(_error.message || "Gửi tin nhắn thất bại");
    },
  });
}

// Hook lấy rate-limit status
export function useRateLimit() {
  return useQuery({
    queryKey: ["rate-limit"],
    queryFn: getRateLimitApi,
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: false,
  });
}

// Hook lấy danh sách pinned messages
export function usePinnedMessages(projectId: number, conversationId: number) {
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
