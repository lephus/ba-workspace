"use client";

import { useParams } from "next/navigation";
import { DocumentList } from "@/features/documents/components";

export default function DocumentsPage() {
  const params = useParams();
  const projectId = Number(params.projectId);

  return (
    <div className="container max-w-5xl py-8">
      <DocumentList projectId={projectId} />
    </div>
  );
}
