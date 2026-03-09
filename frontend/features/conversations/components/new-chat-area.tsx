"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCreateConversation } from "@/features/conversations/hooks";
import { useDocuments, useUploadDocument } from "@/features/documents/hooks";
import type { MessageAttachment } from "@/features/messages/types";
import { ChatInput } from "./chat-input";

interface NewChatAreaProps {
  projectId: number;
}

function generateTitle(content: string, fallbackTitle: string): string {
  const firstLine = content.split("\n").find((l) => l.trim()) || fallbackTitle;
  const trimmed = firstLine.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 47) + "...";
}

export function NewChatArea({ projectId }: NewChatAreaProps) {
  const router = useRouter();
  const t = useTranslations("conversations.newChat");
  const [isSending, setIsSending] = useState(false);

  const { data: documents } = useDocuments(projectId);
  const uploadDocument = useUploadDocument(projectId);
  const createConversation = useCreateConversation(projectId);

  const handleSend = async (
    content: string,
    attachments: MessageAttachment[],
  ) => {
    if (isSending) return;
    setIsSending(true);

    try {
      // 1. Create conversation with auto-generated title (uses hook → invalidates query cache)
      const title = generateTitle(content, t("defaultTitle"));
      const conversation = await createConversation.mutateAsync({ title });

      // 2. Store pending message in sessionStorage for ChatArea to pick up
      sessionStorage.setItem(
        `pending-message-${conversation.id}`,
        JSON.stringify({ content, attachments }),
      );

      // 3. Navigate to the new conversation
      router.push(`/projects/${projectId}/conversations/${conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error(t("createError"));
      setIsSending(false);
    }
  };

  const handleAttach = async (files: File[]): Promise<number[]> => {
    const uploadedIds: number[] = [];
    for (const file of files) {
      try {
        const doc = await uploadDocument.mutateAsync({
          file,
        });
        uploadedIds.push(doc.id);
      } catch {
        // Error toast handled by mutation
      }
    }
    return uploadedIds;
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Welcome area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
          <Sparkles className="text-primary size-8" />
        </div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">
          {t("description")}
        </p>

        <div
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full"
          data-tour="quick-actions"
        >
          {[
            {
              icon: "📋",
              text: t("suggestions.businessRequirements"),
            },
            {
              icon: "📝",
              text: t("suggestions.userStories"),
            },
            {
              icon: "🔍",
              text: t("suggestions.reviewDocuments"),
            },
            {
              icon: "📊",
              text: t("suggestions.analysisReport"),
            },
          ].map((suggestion) => (
            <button
              key={suggestion.text}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left text-sm transition-colors hover:bg-accent"
              onClick={() => handleSend(suggestion.text, [])}
              disabled={isSending}
            >
              <span className="text-lg">{suggestion.icon}</span>
              <span className="text-muted-foreground">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat input */}
      <ChatInput
        onSend={handleSend}
        onAttach={handleAttach}
        existingDocuments={documents?.map((d) => ({
          id: d.id,
          filename: d.filename,
        }))}
        isLoading={isSending}
        autoFocus
      />
    </div>
  );
}
