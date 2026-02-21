"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useConversations } from "@/features/conversations/hooks";
import type { Conversation } from "@/features/conversations/types";
import { ConversationDialog } from "./conversation-dialog";
import { DeleteConversationDialog } from "./delete-conversation-dialog";

interface ConversationSidebarProps {
  projectId: number;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function ConversationSidebar({
  projectId,
  collapsed = false,
  onToggle,
}: ConversationSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params.conversationId
    ? Number(params.conversationId)
    : null;

  const { data: conversations, isLoading } = useConversations(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const handleCreate = () => {
    setSelectedConversation(null);
    setDialogOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedConversation(conversation);
    setDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setDialogOpen(false);
    router.push(
      `/projects/${projectId}/conversations/${conversation.id}`
    );
  };

  const handleConversationDeleted = () => {
    // If the deleted conversation was the active one, navigate back to the list
    if (selectedConversation?.id === activeConversationId) {
      router.push(`/projects/${projectId}/conversations`);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "bg-muted/50 border-r flex flex-col h-full transition-all duration-300",
          collapsed ? "w-0 overflow-hidden" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
                  <Link href="/projects">
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Quay lại dự án</TooltipContent>
            </Tooltip>
            <h2 className="font-semibold text-sm truncate">Cuộc hội thoại</h2>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={handleCreate}
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tạo cuộc hội thoại mới</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={onToggle}
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Thu gọn sidebar</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="size-4 shrink-0 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : !conversations || conversations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Chưa có cuộc hội thoại nào
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleCreate}
                >
                  <Plus className="size-3" />
                  Tạo mới
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <Link
                    key={conversation.id}
                    href={`/projects/${projectId}/conversations/${conversation.id}`}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                      isActive && "bg-accent"
                    )}
                  >
                    <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">
                      {conversation.title}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            isActive && "opacity-100"
                          )}
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right">
                        <DropdownMenuItem
                          onClick={(e) => handleEdit(e, conversation)}
                        >
                          <Pencil className="size-4" />
                          Đổi tên
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(e, conversation)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Link>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Collapsed toggle button */}
      {collapsed && (
        <div className="absolute top-3 left-3 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onToggle}
              >
                <PanelLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Mở sidebar</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
        onSuccess={handleConversationCreated}
      />

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
        onSuccess={handleConversationDeleted}
      />
    </>
  );
}
