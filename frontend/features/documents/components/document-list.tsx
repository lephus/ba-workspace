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
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">Chưa có tài liệu nào</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Tải lên tài liệu liên quan đến dự án để bắt đầu phân tích.
      </p>
      <Button className="mt-4" onClick={onUploadClick}>
        <Plus className="size-4" />
        Tải lên tài liệu
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
  const { data: documents, isLoading, isError, error } = useDocuments(projectId);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ragDialogOpen, setRagDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
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
                  <Button variant="ghost" size="icon" className="size-8" asChild>
                    <Link href={`/projects/${projectId}/conversations`}>
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quay lại cuộc hội thoại</TooltipContent>
              </Tooltip>
              <div>
                <CardTitle>Tài liệu</CardTitle>
                <CardDescription>
                  Quản lý tài liệu liên quan đến dự án.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleUpload}>
              <Plus className="size-4" />
              Tải lên
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DocumentTableSkeleton />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error?.message || "Đã xảy ra lỗi khi tải dữ liệu."}
              </p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <EmptyState onUploadClick={handleUpload} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tên tệp</TableHead>
                  <TableHead className="w-24">Loại</TableHead>
                  <TableHead className="w-28">Kích thước</TableHead>
                  <TableHead className="w-44">Ngày tải lên</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-muted-foreground font-mono">
                      {doc.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileType className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.filename}</p>
                          {doc.ai_task && (
                            <p className="text-xs text-muted-foreground truncate max-w-75">
                              {doc.ai_task}
                            </p>
                          )}
                          {doc.rag_processed_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary mt-0.5">
                              <Sparkles className="size-3" />
                              {doc.assigned_agent
                                ? `Agent: ${doc.assigned_agent}`
                                : "Đã phân tích AI"}
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
                              <span className="sr-only">Xem chi tiết AI</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem phân tích AI</TooltipContent>
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
                              <span className="sr-only">Xóa</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xóa tài liệu</TooltipContent>
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
