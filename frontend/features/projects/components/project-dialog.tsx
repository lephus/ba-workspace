"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
  project?: Project | null;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: ProjectDialogProps) {
  const t = useTranslations('projects');
  const tc = useTranslations('common');
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
            {isEditing ? t('editTitle') : t('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="project-name">{t('projectName')}</FieldLabel>
            <Input
              id="project-name"
              placeholder={t('projectNamePlaceholder')}
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
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? tc('updating')
                  : tc('creating')
                : isEditing
                  ? tc('update')
                  : t('createProject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
