"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteConversation } from "@/features/conversations/hooks";
import type { Conversation } from "@/features/conversations/types";

interface DeleteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  conversation: Conversation | null;
  onSuccess?: () => void;
}

export function DeleteConversationDialog({
  open,
  onOpenChange,
  projectId,
  conversation,
  onSuccess,
}: DeleteConversationDialogProps) {
  const t = useTranslations('conversations');
  const tc = useTranslations('common');
  const deleteConversation = useDeleteConversation(projectId);

  const handleDelete = () => {
    if (!conversation) return;
    deleteConversation.mutate(conversation.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirm', { title: conversation?.title ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteConversation.isPending}>
            {tc('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteConversation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteConversation.isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
