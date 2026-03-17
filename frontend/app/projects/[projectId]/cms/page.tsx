"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FolderOpen, Database } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/features/projects/hooks";
import { ApiKeyManager } from "@/features/settings/components";
import { CmsConnectionManager } from "@/features/cms-integration";

export default function CmsSettingsPage() {
  const t = useTranslations("cms");
  const params = useParams();
  const projectId = Number(params.projectId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);

  return (
    <div className="flex flex-col h-screen">
      {/* Breadcrumb bar */}
      <div className="shrink-0 border-b bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm">
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("breadcrumb.projects")}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground/60" />
        {projectLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <Link
            href={`/projects/${projectId}/conversations`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FolderOpen className="size-3.5 text-primary" />
            <span className="truncate">
              {project?.name ?? `${t("breadcrumb.projects")} #${projectId}`}
            </span>
          </Link>
        )}
        <ChevronRight className="size-3.5 text-muted-foreground/60" />
        <div className="flex items-center gap-1.5 font-medium">
          <Database className="size-3.5 text-primary" />
          {t("title")}
        </div>
        <div className="ml-auto">
          <ApiKeyManager />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <CmsConnectionManager projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
