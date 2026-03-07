"use client";

import { useParams } from "next/navigation";
import { NewChatArea } from "@/features/conversations/components/new-chat-area";

export default function ConversationsPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  return <NewChatArea projectId={projectId} />;
}
