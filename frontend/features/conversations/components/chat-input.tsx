"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessageAttachment } from "@/features/messages/types";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface ExistingDocumentItem {
  id: number;
  filename: string;
}

interface ChatInputProps {
  onSend: (content: string, attachments: MessageAttachment[]) => void;
  onAttach?: (files: File[]) => void;
  existingDocuments?: ExistingDocumentItem[];
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onAttach,
  existingDocuments = [],
  isLoading,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [selectedExistingIds, setSelectedExistingIds] = useState<number[]>([]);
  const [selectedNewFiles, setSelectedNewFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;

    const attachments: MessageAttachment[] = [
      ...selectedExistingIds.map((id) => {
        const doc = existingDocuments.find((d) => d.id === id);
        return { type: "document" as const, id, filename: doc?.filename ?? String(id) };
      }),
      ...selectedNewFiles.map((file) => ({
        type: "file" as const,
        filename: file.name,
      })),
    ];

    onSend(trimmed, attachments);
    setValue("");
    setSelectedExistingIds([]);
    setSelectedNewFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleAttachClick = () => {
    if (isLoading || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedNewFiles((prev) => [...prev, ...newFiles]);
    onAttach?.(newFiles);
    e.target.value = "";
  };

  const toggleExistingDocument = (documentId: number, checked: boolean) => {
    setSelectedExistingIds((prev) => {
      if (checked) {
        if (prev.includes(documentId)) return prev;
        return [...prev, documentId];
      }
      return prev.filter((id) => id !== documentId);
    });
  };

  const removeSelectedNewFile = (target: File) => {
    setSelectedNewFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === target.name &&
            file.size === target.size &&
            file.lastModified === target.lastModified
          )
      )
    );
  };

  const selectedExistingDocuments = existingDocuments.filter((document) =>
    selectedExistingIds.includes(document.id)
  );

  return (
    <div className="bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2 rounded-[28px] border bg-background p-2.5 transition-colors duration-200 ease-in-out">
          {(selectedExistingDocuments.length > 0 || selectedNewFiles.length > 0) && (
            <div className="col-span-3 flex flex-wrap gap-1 px-1 pb-1">
              {selectedExistingDocuments.map((document) => (
                <div
                  key={`existing-${document.id}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-xs"
                >
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="max-w-40 truncate">{document.filename}</span>
                  <button
                    type="button"
                    onClick={() => toggleExistingDocument(document.id, false)}
                    className="inline-flex items-center"
                    aria-label={`Bỏ chọn ${document.filename}`}
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {selectedNewFiles.map((file) => (
                <div
                  key={`new-${file.name}-${file.size}-${file.lastModified}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-xs"
                >
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="max-w-40 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedNewFile(file)}
                    className="inline-flex items-center"
                    aria-label={`Bỏ chọn ${file.name}`}
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                disabled={isLoading || disabled}
                aria-label="Đính kèm tệp"
              >
                <Paperclip className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>Đính kèm tệp</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                File đã upload
              </DropdownMenuLabel>
              {existingDocuments.length > 0 ? (
                <div className="max-h-44 overflow-y-auto">
                  {existingDocuments.map((document) => (
                    <DropdownMenuCheckboxItem
                      key={document.id}
                      checked={selectedExistingIds.includes(document.id)}
                      onCheckedChange={(checked) =>
                        toggleExistingDocument(document.id, checked === true)
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="truncate">{document.filename}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Chưa có file nào
                </p>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAttachClick}>
                <Paperclip className="size-4" />
                Upload file mới
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything"
            disabled={isLoading || disabled}
            className="min-h-10 max-h-50 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-full"
              onClick={handleSend}
              disabled={!value.trim() || isLoading || disabled}
              aria-label="Send prompt"
            >
              {isLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <SendHorizontal className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Nhấn Enter để gửi, Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
