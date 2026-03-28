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
import { useDeleteMultipleConversations } from "@/features/conversations/hooks";

interface DeleteMultipleConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  conversationIds: number[];
  onSuccess?: () => void;
}

export function DeleteMultipleConversationsDialog({
  open,
  onOpenChange,
  projectId,
  conversationIds,
  onSuccess,
}: DeleteMultipleConversationsDialogProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");
  const deleteMultiple = useDeleteMultipleConversations(projectId);

  const handleDelete = () => {
    if (conversationIds.length === 0) return;
    deleteMultiple.mutate(conversationIds, {
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
          <AlertDialogTitle>{t("bulkDelete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("bulkDelete.confirm", { count: conversationIds.length })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMultiple.isPending}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMultiple.isPending}
            variant="destructive"
          >
            {deleteMultiple.isPending
              ? tc("deleting")
              : t("bulkDelete.action", { count: conversationIds.length })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
