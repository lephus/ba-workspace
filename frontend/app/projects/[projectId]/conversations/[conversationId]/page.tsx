"use client";

import { useParams } from "next/navigation";
import { ChatArea } from "@/features/conversations/components/chat-area";

export default function ConversationDetailPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const conversationId = Number(params.conversationId);

  return <ChatArea projectId={projectId} conversationId={conversationId} />;
}
