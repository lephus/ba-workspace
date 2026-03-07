"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  FolderOpen,
  MessageSquare,
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
import { useProjects } from "@/features/projects/hooks";
import type { Project } from "@/features/projects/types";
import { ProjectDialog } from "./project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

function ProjectTableSkeleton() {
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
  const t = useTranslations('projects');
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <FolderOpen className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('empty.description')}
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        <Plus className="size-4" />
        {t('createProject')}
      </Button>
    </div>
  );
}

export function ProjectList() {
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const { data: projects, isLoading, isError, error } = useProjects();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              {t('createProject')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProjectTableSkeleton />
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error?.message || tc('errorLoading')}
              </p>
            </div>
          ) : !projects || projects.length === 0 ? (
            <EmptyState onCreateClick={handleCreate} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{tc('id')}</TableHead>
                  <TableHead>{t('projectName')}</TableHead>
                  <TableHead className="w-44">{t('createdAt')}</TableHead>
                  <TableHead className="w-44">{t('updatedAt')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-muted-foreground font-mono">
                      {project.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id}/conversations`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(project.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">{tc('openMenu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/conversations`}>
                              <MessageSquare className="size-4" />
                              {t('conversations')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/documents`}>
                              <FolderOpen className="size-4" />
                              {t('documents')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Pencil className="size-4" />
                            {tc('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(project)}
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

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={selectedProject}
      />
    </>
  );
}
