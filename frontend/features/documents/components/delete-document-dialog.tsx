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
import { useDeleteDocument } from "@/features/documents/hooks";
import type { Document } from "@/features/documents/types";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  projectId: number;
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  document,
  projectId,
}: DeleteDocumentDialogProps) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const deleteDocument = useDeleteDocument(projectId);

  const handleDelete = () => {
    if (!document) return;
    deleteDocument.mutate(document.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirm', { name: document?.filename ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteDocument.isPending}>
            {tc('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDocument.isPending}
            variant="destructive"
          >
            {deleteDocument.isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
