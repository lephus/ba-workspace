"use client";

import { useParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useProject } from "@/features/projects/hooks";
import { useTranslations } from "next-intl";

export default function ConversationsPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const { data: project } = useProject(projectId);
  const t = useTranslations("conversations");

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-8" />
      </div>
      <h2 className="text-xl font-semibold">{t('selectTitle')}</h2>
      {project && (
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          {project.name}
        </p>
      )}
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {t('selectDesc')}
      </p>
    </div>
  );
}
