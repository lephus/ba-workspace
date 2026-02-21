"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  createConversationSchema,
  type CreateConversationInput,
} from "@/features/conversations/schema";
import {
  useCreateConversation,
  useUpdateConversation,
} from "@/features/conversations/hooks";
import type { Conversation } from "@/features/conversations/types";

interface ConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  conversation?: Conversation | null;
  onSuccess?: (conversation: Conversation) => void;
}

export function ConversationDialog({
  open,
  onOpenChange,
  projectId,
  conversation,
  onSuccess,
}: ConversationDialogProps) {
  const isEditing = !!conversation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateConversationInput>({
    resolver: zodResolver(createConversationSchema),
    defaultValues: {
      title: conversation?.title || "",
    },
  });

  const createConversation = useCreateConversation(projectId);
  const updateConversation = useUpdateConversation(projectId);

  const isLoading =
    createConversation.isPending || updateConversation.isPending;

  useEffect(() => {
    if (open) {
      reset({ title: conversation?.title || "" });
    }
  }, [open, conversation, reset]);

  const onSubmit = (data: CreateConversationInput) => {
    if (isEditing && conversation) {
      updateConversation.mutate(
        { conversationId: conversation.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createConversation.mutate(data, {
        onSuccess: (created) => {
          if (onSuccess) {
            onSuccess(created);
          } else {
            onOpenChange(false);
          }
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa cuộc hội thoại" : "Tạo cuộc hội thoại mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật tiêu đề cuộc hội thoại."
              : "Nhập tiêu đề để tạo cuộc hội thoại mới."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="conversation-title">Tiêu đề</FieldLabel>
            <Input
              id="conversation-title"
              placeholder="Nhập tiêu đề cuộc hội thoại..."
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <FieldDescription className="text-destructive">
                {errors.title.message}
              </FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Đang cập nhật..."
                  : "Đang tạo..."
                : isEditing
                  ? "Cập nhật"
                  : "Tạo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
