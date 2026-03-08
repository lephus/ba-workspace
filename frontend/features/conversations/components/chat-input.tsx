"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  Check,
  FileText,
  Loader2,
  Paperclip,
  SendHorizontal,
  X,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Agents (reusable list for @ mention)                              */
/* ------------------------------------------------------------------ */
interface AgentItem {
  id: string;
  name: string;
  avatar: string;
  title: string;
}

const AGENTS: AgentItem[] = [
  {
    id: "alex",
    name: "Alex",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771653526/Alex_nyfyf4.png",
    title: "Senior Business Analyst",
  },
  {
    id: "emma",
    name: "Emma",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/Emma_pat3ft.png",
    title: "Requirements Agent",
  },
  {
    id: "sarah",
    name: "Sarah",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/Sarah_fyqbgy.png",
    title: "Stakeholder Agent",
  },
  {
    id: "david",
    name: "David",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649419/David_fy6qow.png",
    title: "Compliance Agent",
  },
  {
    id: "paul",
    name: "Paul",
    avatar:
      "https://res.cloudinary.com/gr3atcode/image/upload/v1771649420/Paul_ppffqv.png",
    title: "Traceability Agent",
  },
];

/* ------------------------------------------------------------------ */
/*  Slash‑command definitions                                         */
/* ------------------------------------------------------------------ */
interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/* ------------------------------------------------------------------ */

interface ExistingDocumentItem {
  id: number;
  filename: string;
}

interface UploadingFile {
  file: File;
  tempId: string;
}

interface ChatInputProps {
  onSend: (content: string, attachments: MessageAttachment[]) => void;
  onAttach?: (files: File[]) => Promise<number[]>;
  existingDocuments?: ExistingDocumentItem[];
  isLoading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({
  onSend,
  onAttach,
  existingDocuments = [],
  isLoading,
  disabled,
  autoFocus = false,
}: ChatInputProps) {
  const t = useTranslations("chatInput");
  const [value, setValue] = useState("");
  const [selectedExistingIds, setSelectedExistingIds] = useState<number[]>([]);
  const [selectedNewFiles, setSelectedNewFiles] = useState<File[]>([]);
  const [mentionedAgents, setMentionedAgents] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingUploadsRef = useRef<
    { promise: Promise<number[]>; files: File[] }[]
  >([]);
  const uploadedFileNamesRef = useRef<Map<number, string>>(new Map());
  const isSendingRef = useRef(false);

  /* ---- Auto-focus on mount ---- */
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  /* ---- Message history (Arrow Up/Down like ChatGPT) ---- */
  const messageHistoryRef = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const draftRef = useRef("");

  /* ---- Slash‑command popup state ---- */
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  /* ---- @‑mention popup state ---- */
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  /* ---- File picker popup state (from slash "/" → File đã upload) ---- */
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [filePickerIndex, setFilePickerIndex] = useState(0);
  const filePickerMenuRef = useRef<HTMLDivElement>(null);

  /* ---- Build slash commands (dynamic, uses existingDocuments) ---- */
  const SLASH_COMMANDS: SlashCommand[] = [
    {
      id: "attach-existing",
      label: t("attachExisting"),
      description: t("attachExistingDesc", { count: existingDocuments.length }),
      icon: <FileText className="size-4 text-muted-foreground" />,
    },
    {
      id: "upload-new",
      label: t("uploadNew"),
      description: t("uploadNewDesc"),
      icon: <Upload className="size-4 text-muted-foreground" />,
    },
    {
      id: "mention-agent",
      label: t("mentionAgent"),
      description: t("mentionAgentDesc"),
      icon: <Users className="size-4 text-muted-foreground" />,
    },
  ];

  /* ---- Filtered agents for @‑mention ---- */
  const filteredAgents = AGENTS.filter(
    (a) =>
      a.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  /* ---- Close popups on outside click ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setSlashOpen(false);
        setMentionOpen(false);
        setFilePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---- Helpers ---- */
  const removeTriggerText = useCallback(
    (trigger: string) => {
      // Remove the trigger character (and any trailing query) that opened the popup
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      const before = value.slice(0, pos);
      const triggerIdx = before.lastIndexOf(trigger);
      if (triggerIdx === -1) return;
      const newValue = value.slice(0, triggerIdx) + value.slice(pos);
      setValue(newValue);
      // Move cursor
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = triggerIdx;
        textarea.focus();
      });
    },
    [value],
  );

  /* ---- Toggle existing document selection ---- */
  const toggleExistingDocument = useCallback(
    (documentId: number, checked: boolean) => {
      setSelectedExistingIds((prev) => {
        if (checked) {
          if (prev.includes(documentId)) return prev;
          return [...prev, documentId];
        }
        return prev.filter((id) => id !== documentId);
      });
    },
    [],
  );

  /* ---- Slash command handlers ---- */
  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      removeTriggerText("/");
      switch (cmd.id) {
        case "attach-existing":
          if (existingDocuments.length === 0) {
            toast.info(t("noFilesUploaded"));
          } else if (existingDocuments.length === 1) {
            // Auto-select the only file
            toggleExistingDocument(existingDocuments[0].id, true);
            toast.success(
              t("fileSelected", { name: existingDocuments[0].filename }),
            );
          } else {
            // Show file picker popup
            setFilePickerIndex(0);
            setFilePickerOpen(true);
          }
          textareaRef.current?.focus();
          break;
        case "upload-new":
          fileInputRef.current?.click();
          break;
        case "mention-agent":
          // Insert "@" and open mention popup
          setValue((prev) => {
            const ta = textareaRef.current;
            const pos = ta?.selectionStart ?? prev.length;
            return prev.slice(0, pos) + "@" + prev.slice(pos);
          });
          setTimeout(() => {
            setMentionQuery("");
            setMentionIndex(0);
            setMentionOpen(true);
            textareaRef.current?.focus();
          }, 0);
          break;
      }
    },
    [removeTriggerText, existingDocuments, toggleExistingDocument],
  );

  /* ---- File picker select ---- */
  const handleFilePickerSelect = useCallback(
    (doc: ExistingDocumentItem) => {
      setFilePickerOpen(false);
      toggleExistingDocument(doc.id, true);
      textareaRef.current?.focus();
    },
    [toggleExistingDocument],
  );

  /* ---- @‑mention select ---- */
  const handleMentionSelect = useCallback(
    (agent: AgentItem) => {
      setMentionOpen(false);
      // Replace @query with @Name
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      const before = value.slice(0, pos);
      const atIdx = before.lastIndexOf("@");
      if (atIdx === -1) return;
      const after = value.slice(pos);
      const insertion = `@${agent.name} `;
      const newValue = value.slice(0, atIdx) + insertion + after;
      setValue(newValue);
      // Track mentioned agent
      setMentionedAgents((prev) =>
        prev.includes(agent.id) ? prev : [...prev, agent.id],
      );
      requestAnimationFrame(() => {
        const newPos = atIdx + insertion.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      });
    },
    [value],
  );

  /* ---- Text change handler with popup detection ---- */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const pos = e.target.selectionStart;
    const before = newValue.slice(0, pos);

    // Detect "/" at start or after whitespace
    const slashMatch = before.match(/(^|\s)\/$/);
    if (slashMatch) {
      setSlashIndex(0);
      setSlashOpen(true);
      setMentionOpen(false);
      return;
    }

    // Detect "@" with optional query
    const mentionMatch = before.match(/(^|\s)@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[2]);
      setMentionIndex(0);
      setMentionOpen(true);
      setSlashOpen(false);
      return;
    }

    // Close popups if trigger no longer valid
    if (slashOpen) setSlashOpen(false);
    if (mentionOpen) setMentionOpen(false);
  };

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled || isSendingRef.current) return;

    isSendingRef.current = true;

    try {
      messageHistoryRef.current.push(trimmed);
      setHistoryIndex(-1);
      draftRef.current = "";

      const currentSelectedExistingIds = [...selectedExistingIds];
      const currentSelectedNewFiles = [...selectedNewFiles];

      let extraIds: number[] = [];
      if (pendingUploadsRef.current.length > 0) {
        const results = await Promise.allSettled(
          pendingUploadsRef.current.map((e) => e.promise),
        );
        extraIds = results
          .filter(
            (r): r is PromiseFulfilledResult<number[]> =>
              r.status === "fulfilled",
          )
          .flatMap((r) => r.value);
      }

      const allExistingIds = Array.from(
        new Set([...currentSelectedExistingIds, ...extraIds]),
      );

      const attachments: MessageAttachment[] = [
        ...allExistingIds.map((id) => {
          const doc = existingDocuments.find((d) => d.id === id);
          return {
            type: "document" as const,
            id,
            filename:
              doc?.filename ??
              uploadedFileNamesRef.current.get(id) ??
              String(id),
          };
        }),
        ...currentSelectedNewFiles.map((file) => ({
          type: "file" as const,
          filename: file.name,
        })),
      ];

      onSend(trimmed, attachments);
      setValue("");
      setSelectedExistingIds([]);
      setSelectedNewFiles([]);
      setMentionedAgents([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    /* ---- Navigate slash‑command popup ---- */
    if (slashOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex(
          (i) => (i - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSlashSelect(SLASH_COMMANDS[slashIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }

    /* ---- Navigate @‑mention popup ---- */
    if (mentionOpen && filteredAgents.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredAgents.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + filteredAgents.length) % filteredAgents.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(filteredAgents[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    /* ---- Navigate file picker popup ---- */
    if (filePickerOpen && existingDocuments.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFilePickerIndex((i) => (i + 1) % existingDocuments.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFilePickerIndex(
          (i) => (i - 1 + existingDocuments.length) % existingDocuments.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleFilePickerSelect(existingDocuments[filePickerIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setFilePickerOpen(false);
        return;
      }
    }

    /* ---- Message history navigation (Arrow Up/Down) ---- */
    const history = messageHistoryRef.current;
    if (e.key === "ArrowUp" && history.length > 0) {
      const textarea = textareaRef.current;
      // Skip cursor check when already browsing history
      if (
        textarea &&
        (historyIndex >= 0 || textarea.selectionStart === 0 || value === "")
      ) {
        e.preventDefault();
        if (historyIndex === -1) {
          // Entering history mode — save current draft
          draftRef.current = value;
          const newIdx = history.length - 1;
          setHistoryIndex(newIdx);
          setValue(history[newIdx]);
        } else if (historyIndex > 0) {
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          setValue(history[newIdx]);
        }
        return;
      }
    }
    if (e.key === "ArrowDown" && historyIndex >= 0) {
      const textarea = textareaRef.current;
      // Already in history mode — always allow navigation
      if (textarea) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          setValue(history[newIdx]);
        } else {
          // Reached the end — restore draft
          setHistoryIndex(-1);
          setValue(draftRef.current);
        }
        return;
      }
    }

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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const ACCEPTED = new Set([
      ".txt",
      ".doc",
      ".docx",
      ".pdf",
      ".xlsx",
      ".xls",
    ]);
    const MAX_BYTES = 500 * 1024 * 1024;
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ACCEPTED.has(ext)) {
        toast.error(t("errorFormat", { name: file.name }));
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(t("errorSize", { name: file.name }));
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      if (onAttach) {
        const tempFiles = validFiles.map((file) => ({
          file,
          tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        }));
        setUploadingFiles((prev) => [...prev, ...tempFiles]);

        const uploadPromise = onAttach(validFiles);
        const entry = { promise: uploadPromise, files: validFiles };
        pendingUploadsRef.current.push(entry);

        try {
          const uploadedIds = await uploadPromise;
          uploadedIds.forEach((id, idx) => {
            if (validFiles[idx]) {
              uploadedFileNamesRef.current.set(id, validFiles[idx].name);
            }
          });
          if (uploadedIds.length > 0) {
            setSelectedExistingIds((prev) => [
              ...prev,
              ...uploadedIds.filter((id) => !prev.includes(id)),
            ]);
          }
        } finally {
          pendingUploadsRef.current = pendingUploadsRef.current.filter(
            (e) => e !== entry,
          );
          setUploadingFiles((prev) =>
            prev.filter(
              (uf) => !tempFiles.some((tf) => tf.tempId === uf.tempId),
            ),
          );
        }
      } else {
        setSelectedNewFiles((prev) => [...prev, ...validFiles]);
      }
    }
    e.target.value = "";
  };

  const removeSelectedNewFile = (target: File) => {
    setSelectedNewFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === target.name &&
            file.size === target.size &&
            file.lastModified === target.lastModified
          ),
      ),
    );
  };

  const removeMentionedAgent = (agentId: string) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (agent) {
      // Also remove @Name from text
      setValue((prev) =>
        prev.replace(new RegExp(`@${agent.name}\\s?`, "g"), ""),
      );
    }
    setMentionedAgents((prev) => prev.filter((id) => id !== agentId));
  };

  const selectedExistingDocuments = existingDocuments.filter((document) =>
    selectedExistingIds.includes(document.id),
  );

  const mentionedAgentItems = AGENTS.filter((a) =>
    mentionedAgents.includes(a.id),
  );

  return (
    <div className="bg-background p-4" data-tour="chat-input-area">
      <div className="mx-auto max-w-3xl">
        <div ref={wrapperRef} className="relative">
          {/* ---- Slash‑command popup ---- */}
          {slashOpen && (
            <div
              ref={slashMenuRef}
              className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
            >
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {t("slashCommands")}
              </p>
              {SLASH_COMMANDS.map((cmd, i) => (
                <button
                  key={cmd.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                    i === slashIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                  onMouseEnter={() => setSlashIndex(i)}
                  onClick={() => handleSlashSelect(cmd)}
                >
                  {cmd.icon}
                  <div className="min-w-0 text-left">
                    <p className="font-medium truncate">{cmd.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cmd.description}
                    </p>
                  </div>
                </button>
              ))}
              <div className="mt-1 border-t px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {t("navHint")}
                </p>
              </div>
            </div>
          )}

          {/* ---- @‑mention popup ---- */}
          {mentionOpen && (
            <div
              ref={mentionMenuRef}
              className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
            >
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {t("selectAgent")}
              </p>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent, i) => (
                  <button
                    key={agent.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                      i === mentionIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                    onMouseEnter={() => setMentionIndex(i)}
                    onClick={() => handleMentionSelect(agent)}
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="text-xs">
                        {agent.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.title}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  {t("noAgentFound")}
                </p>
              )}
              <div className="mt-1 border-t px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {t("navHint")}
                </p>
              </div>
            </div>
          )}

          {/* ---- File picker popup ---- */}
          {filePickerOpen &&
            existingDocuments &&
            existingDocuments.length > 0 && (
              <div
                ref={filePickerMenuRef}
                className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
              >
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t("selectFile")}
                </p>
                {uploadingFiles.map((uf) => (
                  <div
                    key={uf.tempId}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm opacity-60"
                  >
                    <Loader2 className="size-4 shrink-0 text-primary animate-spin" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {uf.file.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {t("uploading")}
                    </span>
                  </div>
                ))}
                {existingDocuments.map((doc, i) => {
                  const isSelected = selectedExistingIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                        i === filePickerIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50",
                        isSelected && "opacity-50",
                      )}
                      onMouseEnter={() => setFilePickerIndex(i)}
                      onClick={() => handleFilePickerSelect(doc)}
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-left">
                        {doc.filename}
                      </span>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
                <div className="mt-1 border-t px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground">
                    {t("navHint")}
                  </p>
                </div>
              </div>
            )}

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[28px] border bg-background p-2.5 transition-colors duration-200 ease-in-out">
            {/* ---- Chip row: documents + files + uploading + mentioned agents ---- */}
            {(selectedExistingDocuments.length > 0 ||
              selectedNewFiles.length > 0 ||
              uploadingFiles.length > 0 ||
              mentionedAgentItems.length > 0) && (
              <div className="col-span-3 flex flex-wrap gap-1 px-1 pb-1">
                {selectedExistingDocuments.map((document) => (
                  <div
                    key={`existing-${document.id}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-xs"
                  >
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-40 truncate">
                      {document.filename}
                    </span>
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
                {uploadingFiles.map((uf) => (
                  <div
                    key={uf.tempId}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-xs"
                  >
                    <Loader2 className="size-3.5 shrink-0 text-primary animate-spin" />
                    <span className="max-w-40 truncate text-muted-foreground">
                      {uf.file.name}
                    </span>
                  </div>
                ))}
                {mentionedAgentItems.map((agent) => (
                  <div
                    key={`agent-${agent.id}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs"
                  >
                    <Avatar className="size-4">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="text-[8px]">
                        {agent.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{agent.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMentionedAgent(agent.id)}
                      className="inline-flex items-center"
                      aria-label={`Bỏ tag ${agent.name}`}
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
                {uploadingFiles.length > 0 && (
                  <div className="px-1 pb-1">
                    {uploadingFiles.map((uf) => (
                      <div
                        key={uf.tempId}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-60"
                      >
                        <Loader2 className="size-4 shrink-0 text-primary animate-spin" />
                        <span className="min-w-0 flex-1 truncate">
                          {uf.file.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          Đang tải…
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
              accept=".txt,.doc,.docx,.pdf,.xlsx,.xls"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={t("placeholder")}
              disabled={isLoading || disabled}
              className="min-h-10 max-h-50 resize-none border-0 bg-transparent px-2 pt-2.5 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
            {t("placeholder")}
          </p>
        </div>
      </div>
    </div>
  );
}
