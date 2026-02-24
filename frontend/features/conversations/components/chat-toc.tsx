"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/features/messages/types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface TocEntry {
  id: number;
  preview: string;
  /** 0 = user question (top-level), 1 = assistant reply */
  depth: number;
}

interface ChatTocProps {
  messages: Message[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Truncate text to maxLen chars */
function truncate(text: string, maxLen: number): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > maxLen ? single.slice(0, maxLen) + "…" : single;
}

/** Bar widths by depth (Notion-style) */
const BAR_WIDTH: Record<number, string> = {
  0: "w-4", // 16px — user message
  1: "w-3", // 12px — assistant reply
};

const BAR_INDENT: Record<number, string> = {
  0: "ml-0",
  1: "ml-1",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ChatToc({ messages, className }: ChatTocProps) {
  const [hovered, setHovered] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tocRef = useRef<HTMLDivElement>(null);

  // Build TOC entries from user messages only
  const entries: TocEntry[] = messages
    .filter((m) => m.role === "user")
    .map((m) => ({
      id: m.id,
      preview: truncate(m.content, 60),
      depth: 0,
    }));

  // Track which message is currently in viewport
  useEffect(() => {
    observerRef.current?.disconnect();

    const userMessageIds = entries.map((e) => e.id);
    const elements = userMessageIds
      .map((id) => document.getElementById(`message-${id}`))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (intersections) => {
        // Pick the first visible entry
        for (const entry of intersections) {
          if (entry.isIntersecting) {
            const id = Number(entry.target.id.replace("message-", ""));
            setActiveId(id);
            break;
          }
        }
      },
      { threshold: 0.3 },
    );

    elements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [entries.map((e) => e.id).join(",")]);

  const scrollToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/5");
      setTimeout(() => {
        el.classList.remove("bg-primary/5");
      }, 1500);
    }
  }, []);

  if (entries.length < 2) return null;

  return (
    <div
      ref={tocRef}
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-30 transition-all duration-300 ease-in-out",
        hovered ? "w-56" : "w-7",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "rounded-lg transition-all duration-300",
          hovered ? "bg-popover border shadow-lg" : "bg-transparent",
        )}
      >
        {/* Collapsed: minimap bars */}
        <div
          className={cn(
            "flex flex-col gap-2.5 py-3 transition-all duration-200",
            hovered
              ? "px-3 opacity-0 h-0 py-0 overflow-hidden"
              : "pl-1.5 opacity-100",
          )}
        >
          {entries.map((entry) => (
            <div key={entry.id} className={BAR_INDENT[entry.depth]}>
              <div
                className={cn(
                  "h-0.5 rounded-full transition-all duration-200",
                  BAR_WIDTH[entry.depth],
                  activeId === entry.id
                    ? "bg-foreground shadow-[0_0_3px_var(--foreground)]"
                    : "bg-muted-foreground/30",
                )}
              />
            </div>
          ))}
        </div>

        {/* Expanded: text list */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            hovered ? "opacity-100 max-h-80" : "opacity-0 max-h-0",
          )}
        >
          <div className="px-3 pt-2.5 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Câu hỏi
            </span>
          </div>
          <ScrollArea className="max-h-64">
            <div className="flex flex-col gap-0.5 px-1.5 pb-2">
              {entries.map((entry, idx) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => scrollToMessage(entry.id)}
                  className={cn(
                    "flex items-start gap-2 text-left rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer",
                    "hover:bg-muted",
                    activeId === entry.id
                      ? "text-foreground font-medium bg-muted/60"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60 mt-px w-3 text-right">
                    {idx + 1}
                  </span>
                  <span className="line-clamp-2 leading-snug">
                    {entry.preview}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
