"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
  FileText,
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
import {
  useConversations,
  useTogglePinConversation,
} from "@/features/conversations/hooks";
import type { Conversation } from "@/features/conversations/types";
import { useDocuments } from "@/features/documents/hooks";
import { DocumentListDialog } from "@/features/documents/components/document-list-dialog";
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
  const t = useTranslations("conversations");
  const ts = useTranslations("conversations.sidebar");
  const activeConversationId = params.conversationId
    ? Number(params.conversationId)
    : null;

  const { data: conversations, isLoading } = useConversations(projectId);
  const togglePin = useTogglePinConversation(projectId);

  const pinnedConversations = conversations?.filter((c) => c.pinned) || [];
  const unpinnedConversations = conversations?.filter((c) => !c.pinned) || [];

  const { data: documents } = useDocuments(projectId);
  const documentCount = documents?.length ?? 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentListOpen, setDocumentListOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const handleNewChat = () => {
    router.push(`/projects/${projectId}/conversations`);
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

  const handlePin = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    e.preventDefault();
    togglePin.mutate({
      conversationId: conversation.id,
      pinned: !conversation.pinned,
    });
  };

  const handleConversationUpdated = (_conversation: Conversation) => {
    setDialogOpen(false);
  };

  const handleConversationDeleted = () => {
    if (selectedConversation?.id === activeConversationId) {
      router.push(`/projects/${projectId}/conversations`);
    }
  };

  const activeConversation =
    conversations?.find((c) => c.id === activeConversationId) ?? null;

  const handleGlobalKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (!activeConversation) return;
      if (dialogOpen || deleteDialogOpen) return;

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "F1": {
          e.preventDefault();
          togglePin.mutate({
            conversationId: activeConversation.id,
            pinned: !activeConversation.pinned,
          });
          toast.success(
            activeConversation.pinned ? ts("pinnedUnpinned") : ts("pinnedDone"),
          );
          break;
        }
        case "F2": {
          e.preventDefault();
          setSelectedConversation(activeConversation);
          setDialogOpen(true);
          break;
        }
        case "F3": {
          e.preventDefault();
          setSelectedConversation(activeConversation);
          setDeleteDialogOpen(true);
          break;
        }
      }
    },
    [activeConversation, dialogOpen, deleteDialogOpen, togglePin, ts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <aside
        className={cn(
          "bg-muted/50 border-r flex flex-col h-full transition-all duration-300",
          collapsed ? "w-0 overflow-hidden" : "w-72",
        )}
        data-tour="conversation-sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  asChild
                >
                  <Link href="/projects">
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {ts("backToProjects")}
              </TooltipContent>
            </Tooltip>
            <h2 className="font-semibold text-sm truncate">{t("title")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={handleNewChat}
                  data-tour="new-conversation"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{ts("newConversation")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 relative"
                  onClick={() => setDocumentListOpen(true)}
                  data-tour="documents-icon"
                >
                  <FileText className="size-4" />
                  {documentCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium leading-none">
                      {documentCount > 99 ? "99+" : documentCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {ts("documents")}
                {documentCount > 0 ? ` (${documentCount})` : ""}
              </TooltipContent>
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
              <TooltipContent>{ts("collapseMenu")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1 overflow-hidden">
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
                  {t("empty.title")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleNewChat}
                >
                  <Plus className="size-3" />
                  {t("createNew")}
                </Button>
              </div>
            ) : (
              <>
                {pinnedConversations.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Pin className="size-3" />
                      {t("pinned")}
                    </p>
                    {pinnedConversations.map((conversation) => {
                      const isActive = conversation.id === activeConversationId;
                      return (
                        <Link
                          key={conversation.id}
                          href={`/projects/${projectId}/conversations/${conversation.id}`}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg px-3 py-2 pr-8 text-sm transition-colors hover:bg-accent min-w-0",
                            isActive && "bg-accent",
                          )}
                        >
                          <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 min-w-0 truncate">
                            {conversation.title}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "absolute right-1 top-1/2 -translate-y-1/2 size-6 opacity-0 group-hover:opacity-100 transition-opacity",
                                  isActive && "opacity-100",
                                )}
                                onClick={(e) => e.preventDefault()}
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="right">
                              <DropdownMenuItem
                                onClick={(e) => handlePin(e, conversation)}
                              >
                                <PinOff className="size-4" />
                                <span className="flex-1">{t("unpin")}</span>
                                {isActive && (
                                  <kbd className="ml-auto text-[10px] text-muted-foreground">
                                    F1
                                  </kbd>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleEdit(e, conversation)}
                              >
                                <Pencil className="size-4" />
                                <span className="flex-1">{t("rename")}</span>
                                {isActive && (
                                  <kbd className="ml-auto text-[10px] text-muted-foreground">
                                    F2
                                  </kbd>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(e, conversation)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-4" />
                                <span className="flex-1">
                                  {t("deleteTitle")
                                    .replace("Xóa ", "")
                                    .replace("Delete ", "")}
                                </span>
                                {isActive && (
                                  <kbd className="ml-auto text-[10px] text-muted-foreground">
                                    F3
                                  </kbd>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Link>
                      );
                    })}
                    {unpinnedConversations.length > 0 && (
                      <div className="my-1 border-t" />
                    )}
                  </>
                )}
                {unpinnedConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <Link
                      key={conversation.id}
                      href={`/projects/${projectId}/conversations/${conversation.id}`}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-lg px-3 py-2 pr-8 text-sm transition-colors hover:bg-accent min-w-0",
                        isActive && "bg-accent",
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 min-w-0 truncate">
                        {conversation.title}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute right-1 top-1/2 -translate-y-1/2 size-6 opacity-0 group-hover:opacity-100 transition-opacity",
                              isActive && "opacity-100",
                            )}
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                          <DropdownMenuItem
                            onClick={(e) => handlePin(e, conversation)}
                          >
                            <Pin className="size-4" />
                            <span className="flex-1">{t("pin")}</span>
                            {isActive && (
                              <kbd className="ml-auto text-[10px] text-muted-foreground">
                                F1
                              </kbd>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleEdit(e, conversation)}
                          >
                            <Pencil className="size-4" />
                            <span className="flex-1">{t("rename")}</span>
                            {isActive && (
                              <kbd className="ml-auto text-[10px] text-muted-foreground">
                                F2
                              </kbd>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(e, conversation)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            <span className="flex-1">
                              {t("deleteTitle")
                                .replace("Xóa ", "")
                                .replace("Delete ", "")}
                            </span>
                            {isActive && (
                              <kbd className="ml-auto text-[10px] text-muted-foreground">
                                F3
                              </kbd>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Keyboard shortcut hints */}
        {activeConversation && (
          <div className="shrink-0 border-t px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium mb-1">
              {ts("shortcuts")}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                  F1
                </kbd>{" "}
                {t("pin")}
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                  F2
                </kbd>{" "}
                {t("rename")}
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                  F3
                </kbd>{" "}
                {t("deleteTitle").replace("Xóa ", "").replace("Delete ", "")}
              </span>
            </div>
          </div>
        )}
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
            <TooltipContent side="right">{ts("expandMenu")}</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
        onSuccess={handleConversationUpdated}
      />

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectId={projectId}
        conversation={selectedConversation}
        onSuccess={handleConversationDeleted}
      />

      <DocumentListDialog
        open={documentListOpen}
        onOpenChange={setDocumentListOpen}
        projectId={projectId}
      />
    </>
  );
}
