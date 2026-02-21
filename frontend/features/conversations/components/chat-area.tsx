"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Pin, ChevronDown, ChevronUp, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useMessages,
  useSendMessage,
  usePinnedMessages,
  usePinMessage,
  useUnpinMessage,
} from "@/features/messages/hooks";
import { useConversation } from "@/features/conversations/hooks";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";

interface ChatAreaProps {
  projectId: number;
  conversationId: number;
}

function ChatSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Assistant message skeleton */}
      <div className="flex gap-3">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="space-y-2 max-w-[60%]">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-80 rounded-2xl" />
        </div>
      </div>
      {/* User message skeleton */}
      <div className="flex gap-3 flex-row-reverse">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <Skeleton className="h-12 w-60 rounded-2xl" />
      </div>
      {/* Another assistant */}
      <div className="flex gap-3">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="space-y-2 max-w-[60%]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ChatArea({ projectId, conversationId }: ChatAreaProps) {
  const {
    data: messages,
    isLoading: messagesLoading,
    isError,
    error,
  } = useMessages(projectId, conversationId);

  const { data: conversation } = useConversation(projectId, conversationId);
  const { data: pinnedMessages } = usePinnedMessages(projectId, conversationId);

  const sendMessage = useSendMessage(projectId, conversationId);
  const pinMessage = usePinMessage(projectId, conversationId);
  const unpinMessage = useUnpinMessage(projectId, conversationId);

  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);

  const pinnedMessageIds = useMemo(
    () => new Set(pinnedMessages?.map((p) => p.message_id) ?? []),
    [pinnedMessages]
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change (new message, optimistic update, server response)
  useEffect(() => {
    // Small delay to ensure DOM is painted before scrolling
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, sendMessage.isPending]);

  const handleSend = (content: string) => {
    sendMessage.mutate({
      role: "user",
      content: {
        content_type: "text",
        parts: content.split("\n").filter((line) => line.trim() !== ""),
      },
    });
  };

  const handlePin = (messageId: number) => {
    pinMessage.mutate(messageId);
  };

  const handleUnpin = (messageId: number) => {
    unpinMessage.mutate(messageId);
  };

  const scrollToMessage = (messageId: number) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-amber-50", "dark:bg-amber-950/30");
      setTimeout(() => {
        el.classList.remove("bg-amber-50", "dark:bg-amber-950/30");
      }, 2000);
    }
    setPinnedPanelOpen(false);
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Chat header */}
      <div className="shrink-0 border-b">
        <div className="flex items-center gap-3 px-6 py-3">
          <MessageSquare className="size-5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate">
              {conversation?.title || "Cuộc hội thoại"}
            </h2>
          </div>
          {pinnedMessages && pinnedMessages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setPinnedPanelOpen(!pinnedPanelOpen)}
                >
                  <Pin className="size-3.5 text-amber-500" />
                  <span>{pinnedMessages.length}</span>
                  {pinnedPanelOpen ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tin nhắn đã ghim</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Pinned messages panel */}
        {pinnedPanelOpen && pinnedMessages && pinnedMessages.length > 0 && (
          <div className="border-t bg-amber-50/50 dark:bg-amber-950/20 px-6 py-2 max-h-40 overflow-y-auto">
            <div className="space-y-1.5">
              {pinnedMessages.map((pin) => (
                <div
                  key={pin.id}
                  className="flex items-center gap-2 group/pin"
                >
                  <button
                    className="flex-1 min-w-0 flex items-center gap-2 text-left text-xs hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded px-2 py-1 transition-colors"
                    onClick={() => scrollToMessage(pin.message_id)}
                  >
                    <Pin className="size-3 text-amber-500 shrink-0" />
                    <span className="truncate text-muted-foreground">
                      {pin.message_preview}
                    </span>
                  </button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 opacity-0 group-hover/pin:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleUnpin(pin.message_id)}
                      >
                        <X className="size-3 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Bỏ ghim</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto max-w-3xl">
          {messagesLoading ? (
            <ChatSkeleton />
          ) : isError ? (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-destructive text-sm">
                {error?.message || "Đã xảy ra lỗi khi tải tin nhắn."}
              </p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <MessageSquare className="text-muted-foreground size-8" />
              </div>
              <h3 className="text-lg font-semibold">
                Bắt đầu cuộc hội thoại
              </h3>
              <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                Hãy gửi tin nhắn đầu tiên để bắt đầu phân tích nghiệp vụ.
              </p>
            </div>
          ) : (
            <div className="px-4 py-2">
              {messages.map((message) => (
                <div key={message.id} id={`message-${message.id}`} className="transition-colors duration-500 rounded-lg">
                  <MessageBubble
                    message={message}
                    isPinned={pinnedMessageIds.has(message.id)}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                  />
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3 py-4">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3 rounded-tl-md">
                      <div className="size-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0ms]" />
                      <div className="size-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
                      <div className="size-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat input */}
      <ChatInput onSend={handleSend} isLoading={sendMessage.isPending} />
    </div>
  );
}
