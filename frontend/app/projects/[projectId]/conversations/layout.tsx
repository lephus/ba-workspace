"use client";

import { useState } from "react";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";
import { useParams } from "next/navigation";
import { useProject } from "@/features/projects/hooks";
import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiKeyManager } from "@/features/settings/components";

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = Number(params.projectId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Project breadcrumb bar */}
      <div className="shrink-0 border-b bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm">
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Dự án
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground/60" />
        {projectLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <div className="flex items-center gap-1.5 font-medium truncate">
            <FolderOpen className="size-3.5 text-primary" />
            <span className="truncate">
              {project?.name ?? `Dự án #${projectId}`}
            </span>
          </div>
        )}
        <div className="ml-auto">
          <ApiKeyManager />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 relative overflow-hidden min-h-0">
        <ConversationSidebar
          projectId={projectId}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full">{children}</main>
      </div>
    </div>
  );
}
