"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages, useSendMessage } from "@/features/messages/hooks";
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

  const sendMessage = useSendMessage(projectId, conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessage.mutate({ role: "user", content });
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0">
        <MessageSquare className="size-5 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate">
            {conversation?.title || "Cuộc hội thoại"}
          </h2>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
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
                <MessageBubble key={message.id} message={message} />
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
