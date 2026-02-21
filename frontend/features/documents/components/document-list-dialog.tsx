"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, FileType, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import { useDocuments } from "@/features/documents/hooks";
import type { Document } from "@/features/documents/types";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { DeleteDocumentDialog } from "./delete-document-dialog";

function DocumentTableSkeleton() {
  return (
    <div className="space-y-3 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">Chưa có tài liệu nào</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Tải lên tài liệu liên quan đến dự án để bắt đầu phân tích.
      </p>
      <Button className="mt-4" onClick={onUploadClick}>
        <Upload className="size-4" />
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

interface DocumentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function DocumentListDialog({
  open,
  onOpenChange,
  projectId,
}: DocumentListDialogProps) {
  const { data: documents, isLoading, isError, error } = useDocuments(projectId);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl w-full flex flex-col"
          showCloseButton
        >
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between pr-6">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Tài liệu
                  {documents && documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {documents.length}
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Quản lý tài liệu liên quan đến dự án.
                </SheetDescription>
              </div>
              <Button size="sm" onClick={handleUpload}>
                <Plus className="size-4" />
                Tải lên
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-1 py-2">
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
                      <TableHead>Tên tệp</TableHead>
                      <TableHead className="w-20">Loại</TableHead>
                      <TableHead className="w-24">Kích thước</TableHead>
                      <TableHead className="w-32">Ngày tải</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <FileType className="size-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm">
                                {doc.filename}
                              </p>
                              {doc.ai_task && (
                                <p className="text-xs text-muted-foreground truncate max-w-48">
                                  {doc.ai_task}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getFileTypeColor(doc.file_type)}
                            className="text-xs"
                          >
                            {(doc.file_type ?? "N/A").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatFileSize(doc.file_size)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDate(doc.created_at)}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(doc)}
                              >
                                <Trash2 className="size-3.5" />
                                <span className="sr-only">Xóa</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xóa tài liệu</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
