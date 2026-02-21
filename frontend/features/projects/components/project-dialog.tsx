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
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { createProjectSchema, type CreateProjectInput } from "@/features/projects/schema";
import { useCreateProject, useUpdateProject } from "@/features/projects/hooks";
import type { Project } from "@/features/projects/types";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null; // null = create mode, Project = edit mode
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: ProjectDialogProps) {
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: project?.name || "",
    },
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isLoading = createProject.isPending || updateProject.isPending;

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open) {
      reset({ name: project?.name || "" });
    }
  }, [open, project, reset]);

  const onSubmit = (data: CreateProjectInput) => {
    if (isEditing && project) {
      updateProject.mutate(
        { projectId: project.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createProject.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin dự án của bạn."
              : "Nhập tên để tạo dự án mới."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="project-name">Tên dự án</FieldLabel>
            <Input
              id="project-name"
              placeholder="Nhập tên dự án..."
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <FieldDescription className="text-destructive">
                {errors.name.message}
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
                  : "Tạo dự án"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
