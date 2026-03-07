"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  MessageSquare,
  ArrowLeft,
  Pin,
  PinOff,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useConversations, useTogglePinConversation } from "@/features/conversations/hooks";
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
  const t = useTranslations('conversations');
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('empty.description')}
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        <Plus className="size-4" />
        {t('create')}
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
  const t = useTranslations('conversations');
  const tc = useTranslations('common');

  const {
    data: conversations,
    isLoading,
    isError,
    error,
  } = useConversations(projectId);

  const togglePin = useTogglePinConversation(projectId);

  const sortedConversations = conversations
    ? [...conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    })
    : undefined;

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

  const handleTogglePin = (conversation: Conversation) => {
    togglePin.mutate({
      conversationId: conversation.id,
      pinned: !conversation.pinned,
    });
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          {projectName && (
            <p className="text-muted-foreground mt-1">
              {t('project')}: {projectName}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('list')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              {t('create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ConversationTableSkeleton />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error?.message || tc('errorLoading')}
              </p>
            </div>
          ) : !sortedConversations || sortedConversations.length === 0 ? (
            <EmptyState onCreateClick={handleCreate} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{tc('id')}</TableHead>
                  <TableHead>{t('conversationTitle')}</TableHead>
                  <TableHead className="w-44">{t('createdAt')}</TableHead>
                  <TableHead className="w-44">{t('updatedAt')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="text-muted-foreground font-mono">
                      {conversation.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${projectId}/conversations/${conversation.id}`}
                        className="hover:underline inline-flex items-center gap-1.5"
                      >
                        {conversation.pinned && (
                          <Pin className="size-3.5 text-muted-foreground shrink-0" />
                        )}
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
                            <span className="sr-only">{tc('openMenu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(conversation)}
                          >
                            {conversation.pinned ? (
                              <>
                                <PinOff className="size-4" />
                                {t('unpin')}
                              </>
                            ) : (
                              <>
                                <Pin className="size-4" />
                                {t('pin')}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(conversation)}
                          >
                            <Pencil className="size-4" />
                            {tc('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(conversation)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            {tc('delete')}
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
