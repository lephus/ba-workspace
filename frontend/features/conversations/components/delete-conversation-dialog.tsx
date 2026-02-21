"use client";

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
          <AlertDialogTitle>Xóa cuộc hội thoại</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa cuộc hội thoại{" "}
            <strong>&ldquo;{conversation?.title}&rdquo;</strong>? Hành động này
            không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteConversation.isPending}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteConversation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteConversation.isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
