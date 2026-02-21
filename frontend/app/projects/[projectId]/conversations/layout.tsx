"use client";

import { useState } from "react";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";
import { useParams } from "next/navigation";

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = Number(params.projectId);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen relative overflow-hidden">
      <ConversationSidebar
        projectId={projectId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {children}
      </main>
    </div>
  );
}
