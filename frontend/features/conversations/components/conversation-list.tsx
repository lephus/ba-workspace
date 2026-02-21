"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  MessageSquare,
  ArrowLeft,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useConversations } from "@/features/conversations/hooks";
import type { Conversation } from "@/features/conversations/types";
import { ConversationDialog } from "./conversation-dialog";
import { DeleteConversationDialog } from "./delete-conversation-dialog";

function ConversationTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">Chưa có cuộc hội thoại nào</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Bắt đầu bằng cách tạo cuộc hội thoại đầu tiên.
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        <Plus className="size-4" />
        Tạo cuộc hội thoại
      </Button>
    </div>
  );
}

interface ConversationListProps {
  projectId: number;
  projectName?: string;
}

export function ConversationList({
  projectId,
  projectName,
}: ConversationListProps) {
  const {
    data: conversations,
    isLoading,
    isError,
    error,
  } = useConversations(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const handleCreate = () => {
    setSelectedConversation(null);
    setDialogOpen(true);
  };

  const handleEdit = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDialogOpen(true);
  };

  const handleDelete = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuộc hội thoại</h1>
          {projectName && (
            <p className="text-muted-foreground mt-1">
              Dự án: {projectName}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách cuộc hội thoại</CardTitle>
              <CardDescription>
                Quản lý các cuộc hội thoại trong dự án.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              Tạo cuộc hội thoại
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ConversationTableSkeleton />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error?.message || "Đã xảy ra lỗi khi tải dữ liệu."}
              </p>
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <EmptyState onCreateClick={handleCreate} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-44">Ngày tạo</TableHead>
                  <TableHead className="w-44">Cập nhật lần cuối</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="text-muted-foreground font-mono">
                      {conversation.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${projectId}/conversations/${conversation.id}`}
                        className="hover:underline"
                      >
                        {conversation.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(conversation.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(conversation.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Mở menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(conversation)}
                          >
                            <Pencil className="size-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(conversation)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
      />

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
      />
    </>
  );
}
