"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  FileText,
  FileType,
  ArrowLeft,
  Info,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useDocuments } from "@/features/documents/hooks";
import type { Document } from "@/features/documents/types";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { DeleteDocumentDialog } from "./delete-document-dialog";
import { DocumentRagDialog } from "./document-rag-dialog";

function DocumentTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  const t = useTranslations('documents');
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('empty.description')}
      </p>
      <Button className="mt-4" onClick={onUploadClick}>
        <Plus className="size-4" />
        {t('upload')}
      </Button>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeColor(fileType: string | undefined | null) {
  switch (fileType?.toLowerCase()) {
    case "pdf":
      return "destructive";
    case "docx":
      return "default";
    case "txt":
      return "secondary";
    default:
      return "outline";
  }
}

interface DocumentListProps {
  projectId: number;
}

export function DocumentList({ projectId }: DocumentListProps) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');

  const {
    data: documents,
    isLoading,
    isError,
    error,
  } = useDocuments(projectId);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ragDialogOpen, setRagDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );

  const handleUpload = () => {
    setUploadDialogOpen(true);
  };

  const handleDelete = (doc: Document) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const handleViewRag = (doc: Document) => {
    setSelectedDocument(doc);
    setRagDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    asChild
                  >
                    <Link href={`/projects/${projectId}/conversations`}>
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('backToConversations')}</TooltipContent>
              </Tooltip>
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                  {t('description')}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleUpload}>
              <Plus className="size-4" />
              {t('upload')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DocumentTableSkeleton />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error?.message || tc('errorLoading')}
              </p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <EmptyState onUploadClick={handleUpload} />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{tc('id')}</TableHead>
                  <TableHead className="w-auto">{t('fileName')}</TableHead>
                  <TableHead className="w-24">{t('type')}</TableHead>
                  <TableHead className="w-28">{t('size')}</TableHead>
                  <TableHead className="w-44">{t('uploadedAt')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-muted-foreground font-mono">
                      {doc.id}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileType className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <p
                            className="font-medium truncate"
                            title={doc.filename}
                          >
                            {doc.filename}
                          </p>
                          {doc.ai_task && (
                            <p className="text-xs text-muted-foreground truncate max-w-75">
                              {doc.ai_task}
                            </p>
                          )}
                          {doc.rag_processed_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary mt-0.5">
                              <Sparkles className="size-3" />
                              {doc.assigned_agent
                                ? `${t('agent')}: ${doc.assigned_agent}`
                                : t('aiProcessed')}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getFileTypeColor(doc.file_type)}>
                        {(doc.file_type ?? "N/A").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewRag(doc)}
                            >
                              <Info className="size-4" />
                              <span className="sr-only">{t('viewAiDetail')}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('viewAiAnalysis')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(doc)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">{tc('delete')}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('deleteTitle')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        projectId={projectId}
      />

      <DeleteDocumentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        document={selectedDocument}
        projectId={projectId}
      />

      <DocumentRagDialog
        open={ragDialogOpen}
        onOpenChange={setRagDialogOpen}
        document={selectedDocument}
      />
    </>
  );
}
