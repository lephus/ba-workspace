"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { useUploadDocument } from "@/features/documents/hooks";

const ACCEPTED_FORMATS = ".pdf,.docx,.doc,.txt,.xlsx,.xls";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTS = new Set(["pdf", "docx", "doc", "txt", "xlsx", "xls"]);

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  projectId,
}: UploadDocumentDialogProps) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiTask, setAiTask] = useState("");
  const [notes, setNotes] = useState("");
  const [fileError, setFileError] = useState("");

  const uploadDocument = useUploadDocument(projectId);

  const resetForm = () => {
    setSelectedFile(null);
    setAiTask("");
    setNotes("");
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetForm();
    }
    onOpenChange(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTS.has(ext)) {
      setFileError(t('errorFormat'));
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(t('errorSize'));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setFileError(t('errorRequired'));
      return;
    }

    uploadDocument.mutate(
      {
        file: selectedFile,
        ai_task: aiTask.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('uploadTitle')}</DialogTitle>
          <DialogDescription>
            {t('uploadDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          {/* File input */}
          <Field>
            <FieldLabel>{t('fileLabel')}</FieldLabel>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{t('clickToSelect')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('fileFormats')}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/30 overflow-hidden">
                <FileText className="size-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p
                    className="text-sm font-medium truncate"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={handleRemoveFile}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && (
              <FieldDescription className="text-destructive">
                {fileError}
              </FieldDescription>
            )}
          </Field>

          {/* AI Task */}
          <Field>
            <FieldLabel htmlFor="ai-task">{t('aiTask')}</FieldLabel>
            <Textarea
              id="ai-task"
              placeholder={t('aiTaskPlaceholder')}
              value={aiTask}
              onChange={(e) => setAiTask(e.target.value)}
              rows={2}
            />
            <FieldDescription>
              {t('aiTaskDesc')}
            </FieldDescription>
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="doc-notes">{t('notes')}</FieldLabel>
            <Textarea
              id="doc-notes"
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={uploadDocument.isPending}
            >
              {tc('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={uploadDocument.isPending || !selectedFile}
            >
              {uploadDocument.isPending ? (
                tc('uploading')
              ) : (
                <>
                  <Upload className="size-4" />
                  {t('upload')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
